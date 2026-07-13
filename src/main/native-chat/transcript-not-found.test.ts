import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readNativeChatTranscript } from './transcript-reader'
import {
  clearNativeChatTranscriptCache,
  readNativeChatTranscriptCached
} from './transcript-read-cache'

// These cover the "No transcript found on a just-created session that is actually
// alive" race (#8401): Claude Code lazily flushes the first turn, so the session
// .jsonl briefly does not exist. A missing file must surface as a RETRYABLE
// notFound, never a hard error, and a notFound must not be cached (else the later
// real read is masked by the cached miss).

let tempRoots: string[] = []

beforeEach(() => {
  clearNativeChatTranscriptCache()
  tempRoots = []
})

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })))
  tempRoots = []
})

function jsonLines(records: unknown[]): string {
  return records.map((record) => JSON.stringify(record)).join('\n')
}

async function emptyProjectsDir(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'orca-native-chat-notfound-'))
  tempRoots.push(root)
  return join(root, 'projects')
}

describe('readNativeChatTranscript — notFound vs hard error', () => {
  it('flags an unresolvable session as notFound (retryable), not a hard error', async () => {
    const result = await readNativeChatTranscript('claude', 'not-flushed-yet', {
      claudeProjectsDir: await emptyProjectsDir()
    })
    expect('error' in result).toBe(true)
    expect('notFound' in result && result.notFound).toBe(true)
  })

  it('flags an ENOENT after resolve (file vanished/not-yet-there) as notFound', async () => {
    const result = await readNativeChatTranscript('claude', 'sess', {
      filePath: join(tmpdir(), 'orca-native-chat-8401-does-not-exist.jsonl')
    })
    expect('error' in result).toBe(true)
    expect('notFound' in result && result.notFound).toBe(true)
  })

  it('keeps a genuine non-ENOENT read error a HARD error (no notFound)', async () => {
    // A directory path makes createReadStream fail with EISDIR — a real failure,
    // not a not-yet-flushed file, so it must stay a hard error the UI surfaces.
    const dir = await mkdtemp(join(tmpdir(), 'orca-native-chat-eisdir-'))
    tempRoots.push(dir)
    const result = await readNativeChatTranscript('claude', 'sess', { filePath: dir })
    expect('error' in result).toBe(true)
    expect('notFound' in result && result.notFound).toBeFalsy()
  })
})

describe('readNativeChatTranscriptCached — notFound is retryable and never masks a real read', () => {
  it('returns a notFound (not a hard error) for a not-yet-created session file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'orca-native-chat-notfound-cache-'))
    tempRoots.push(root)
    process.env.HOME = root
    const result = await readNativeChatTranscriptCached('claude', 'absent-session')
    expect('error' in result).toBe(true)
    expect('notFound' in result && result.notFound).toBe(true)
  })

  it('does not cache the notFound miss: a later read after the file appears succeeds', async () => {
    const root = await mkdtemp(join(tmpdir(), 'orca-native-chat-notfound-appears-'))
    tempRoots.push(root)
    process.env.HOME = root
    const sessionId = 'lazy-flush'

    // First read races the lazy first flush: the file does not exist yet.
    const first = await readNativeChatTranscriptCached('claude', sessionId)
    expect('notFound' in first && first.notFound).toBe(true)

    // Claude Code flushes the transcript moments later.
    const projectDir = join(root, '.claude', 'projects', '-repo')
    await mkdir(projectDir, { recursive: true })
    await writeFile(
      join(projectDir, `${sessionId}.jsonl`),
      jsonLines([
        {
          type: 'user',
          uuid: 'u-0',
          timestamp: '2026-06-01T10:00:00.000Z',
          message: { role: 'user', content: 'hello there' }
        }
      ])
    )

    // The second read must re-resolve and read the now-present file, not serve a
    // cached miss (which would keep the pane stuck on "No transcript found").
    const second = await readNativeChatTranscriptCached('claude', sessionId)
    expect('messages' in second).toBe(true)
    if (!('messages' in second)) {
      return
    }
    expect(second.messages).toHaveLength(1)
  })
})
