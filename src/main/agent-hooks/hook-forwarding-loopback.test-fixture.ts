// Why: the forwarding path is what users exercise on every hook event, so a
// shared loopback harness lets the POSIX and Windows regression suites assert
// the same wire contract (route, auth, pane key, exact payload) against a real
// process rather than re-deriving string positions.
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect } from 'vitest'

// Why: a realistic payload must survive a shell variable, `printf`, curl's
// urlencoding, and (on Windows) a PowerShell JSON round-trip unchanged. It mixes
// multiline text, multi-byte Unicode, both quote styles, and shell metacharacters
// that would corrupt the post if any layer re-evaluated the payload.
const FORWARDING_PAYLOAD_OBJECT = {
  hook_event_name: 'PostToolUse',
  session_id: 'sess_ünïçödé_🚀',
  cwd: '/home/dev/work space/日本語プロジェクト',
  tool_name: 'Bash',
  tool_input: {
    command: "grep -R 'TODO' . | awk '{print $1}' > out.txt && echo `date` ; rm -rf $TMP",
    description:
      'shell-significant: $(id) ${PATH} <redir> *glob* (subshell) \\escaped\\ "quoted" \'apos\''
  },
  tool_response: {
    stdout:
      'línea uno\nlínea dos\tcafé résumé — 日本語 Кириллица 🎉\n"double" \'single\' & | ; < >',
    stderr: '',
    // Why: pad past the OS pipe buffer (~64 KB) so the script must drain stdin
    // to EOF before curl finishes reading the payload from `@-`.
    transcript: 'A'.repeat(200_000)
  },
  numbers: [1, 2.5, -3, 10_000_000_000],
  nested: { deep: { value: true, list: ['a', 'b\nc'] } }
}

export const FORWARDING_PAYLOAD = JSON.stringify(FORWARDING_PAYLOAD_OBJECT)

// Why: the token travels in an HTTP header, so it must stay header-safe ASCII;
// the other fields deliberately carry separators the receiver must preserve.
export const FORWARDING_METADATA = {
  token: 'orca-hook-token-a1b2c3d4',
  paneKey: 'tab_7f3a2:leaf-9c2e1',
  tabId: 'tab_7f3a2',
  launchToken: 'launch-55aa',
  worktreeId: '/home/dev/work space/wt-1',
  env: 'dev',
  version: '1.4.138'
} as const

// Why: mirror the Orca hook runtime env exactly. Scripts read these ORCA_* vars
// directly (endpoint file empty) and forward them as form/JSON fields.
export function forwardingMetadataEnv(port: number): NodeJS.ProcessEnv {
  return {
    ORCA_AGENT_HOOK_PORT: String(port),
    ORCA_AGENT_HOOK_TOKEN: FORWARDING_METADATA.token,
    ORCA_PANE_KEY: FORWARDING_METADATA.paneKey,
    ORCA_TAB_ID: FORWARDING_METADATA.tabId,
    ORCA_AGENT_LAUNCH_TOKEN: FORWARDING_METADATA.launchToken,
    ORCA_WORKTREE_ID: FORWARDING_METADATA.worktreeId,
    ORCA_AGENT_HOOK_ENV: FORWARDING_METADATA.env,
    ORCA_AGENT_HOOK_VERSION: FORWARDING_METADATA.version
  }
}

export type ForwardingRequest = {
  url: string
  token: string | null
  contentType: string | null
  body: string
}

export type ForwardingServer = {
  port: number
  requests: ForwardingRequest[]
  reset: () => void
  close: () => Promise<void>
}

// Why: a loopback receiver captures exactly what each generated script puts on
// the wire, so the suite asserts real forwarding rather than script structure.
export function startForwardingServer(): Promise<ForwardingServer> {
  const requests: ForwardingRequest[] = []
  const server = createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk as Buffer))
    req.on('end', () => {
      requests.push({
        url: req.url ?? '',
        token: firstHeader(req.headers['x-orca-agent-hook-token']),
        contentType: firstHeader(req.headers['content-type']),
        body: Buffer.concat(chunks).toString('utf8')
      })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{}')
    })
  })
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port
      resolve({
        port,
        requests,
        reset: () => {
          requests.length = 0
        },
        close: () =>
          new Promise<void>((done, fail) => server.close((error) => (error ? fail(error) : done())))
      })
    })
  })
}

function firstHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

export type HookForwardingRun = {
  exitCode: number | null
  stdinErrors: NodeJS.ErrnoException[]
  stdout: string
}

// Why: capture stdout too — the forwarding path must still emit protocol JSON
// (Gemini/Copilot/Antigravity) before it reads and posts stdin.
export function runHookCapturingStdout(
  executable: string,
  args: string[],
  env: NodeJS.ProcessEnv
): Promise<HookForwardingRun> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { env, stdio: ['pipe', 'pipe', 'ignore'] })
    const stdinErrors: NodeJS.ErrnoException[] = []
    const stdoutChunks: Buffer[] = []
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('hook did not finish after stdin closed'))
    }, 10_000)
    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.stdin.on('error', (error: NodeJS.ErrnoException) => stdinErrors.push(error))
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    child.on('close', (exitCode) => {
      clearTimeout(timeout)
      resolve({ exitCode, stdinErrors, stdout: Buffer.concat(stdoutChunks).toString('utf8') })
    })
    child.stdin.end(FORWARDING_PAYLOAD)
  })
}

export type ForwardingBodyFormat = 'form' | 'json'

// Why: one contract check for both platforms — the curl scripts post
// form-urlencoded bytes (exact payload), while the PowerShell scripts parse and
// re-serialize JSON (structurally-equal payload). Both must route and authenticate
// identically and preserve the pane key.
export function assertForwardingRequest(
  request: ForwardingRequest | undefined,
  options: { route: string; bodyFormat: ForwardingBodyFormat; label: string }
): void {
  const { route, bodyFormat, label } = options
  expect(request, `${label} received a forwarded request`).toBeDefined()
  expect(request!.url, `${label} route`).toBe(`/hook/${route}`)
  expect(request!.token, `${label} hook token`).toBe(FORWARDING_METADATA.token)
  if (bodyFormat === 'form') {
    const params = new URLSearchParams(request!.body)
    expect(params.get('paneKey'), `${label} pane key`).toBe(FORWARDING_METADATA.paneKey)
    expect(params.get('payload'), `${label} exact payload`).toBe(FORWARDING_PAYLOAD)
    return
  }
  const body = JSON.parse(request!.body) as { paneKey?: string; payload?: unknown }
  expect(body.paneKey, `${label} pane key`).toBe(FORWARDING_METADATA.paneKey)
  expect(body.payload, `${label} structural payload`).toEqual(FORWARDING_PAYLOAD_OBJECT)
}
