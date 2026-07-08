import { describe, expect, it } from 'vitest'
import { createPromptEchoScanner, foldTerminalTextForEchoMatch } from './prompt-echo-scanner'

const PROMPT =
  'Resolve the current merge conflicts UNIQUEMARKER7466 and report the final git status.'

// Real PTY excerpts captured 2026-07-08 from codex 0.143.0 and claude on
// macOS (120x40) while bracket-pasting PROMPT (no Enter). Codex positions
// every word with a CSI cursor move — the stream contains no literal spaces.
const CODEX_VERBATIM_ECHO =
  '───────────────────╯\x1b[11;1H\x1b[22m\x1b[1m›\x1b[11;3H\x1b[22mResolve\x1b[11;11Hthe\x1b[11;15Hcurrent\x1b[11;23Hmerge\x1b[11;29Hconflicts\x1b[11;39HUNIQUEMARKER7466\x1b[11;56Hand\x1b[11;60Hreport\x1b[11;67Hthe\x1b[11;71Hfinal\x1b[11;77Hgit\x1b[11;81Hstatus.\x1b[13;3H\x1b[38;2;246;226;183;49m'
const CODEX_LARGE_PLACEHOLDER =
  ' │\x1b[8;1H╰────────────────────────────────────────────────╯\x1b[11;1H\x1b[22m\x1b[1m›\x1b[11;3H\x1b[22m\x1b[38;5;6;49m[Pasted Content 4295 chars]\x1b[13;3H\x1b[38;2;246;226;183;49mgpt-5.5 default'
const CLAUDE_VERBATIM_ECHO =
  '25l\x1b[H\r\x1b[2C\x1b[36BResolve the current merge conflicts\x1b[39GUNIQUEMARKER7466\x1b[56Gand\x1b[60Greport\x1b[67Gthe\x1b[71Gfinal\x1b[77Ggit\x1b[81Gstatus.\x1b[40;1H\x1b[37;88H\x1b[?25h'
const CLAUDE_LARGE_PLACEHOLDER =
  '25l\x1b[H\r\x1b[2C\x1b[36B[Pasted text #1 +39 lines]\x1b[K\r\x1b[2C\x1b[3B\x1b[38;2;153;153;153mpaste again to expand'
// Codex's directory-trust screen swallowing the paste: it only redraws
// (clear-to-EOL per row) and never renders any of the pasted characters.
const CODEX_TRUST_SWALLOW_REDRAW =
  '\x1b[?2026h\x1b[1;58H\x1b[0m\x1b[49m\x1b[K\x1b[2;2H\x1b[0m\x1b[49m\x1b[K\x1b[3;112H\x1b[0m\x1b[49m\x1b[K\x1b[4;99H\x1b[0m\x1b[49m\x1b[K\x1b[5;2H\x1b[0m\x1b[49m\x1b[K\x1b[6;19H\x1b[0m\x1b[49m\x1b[K\x1b[7;14H\x1b[0m\x1b[49m\x1b[K\x1b[8;2H\x1b[0m\x1b[49m\x1b[K'

function feedInChunks(data: string, chunkSize: number, content = PROMPT): boolean {
  const scanner = createPromptEchoScanner(content)
  for (let i = 0; i < data.length; i += chunkSize) {
    if (scanner.observe(data.slice(i, i + chunkSize))) {
      return true
    }
  }
  return false
}

describe('foldTerminalTextForEchoMatch', () => {
  it('strips escapes, whitespace, and punctuation down to comparable text', () => {
    expect(foldTerminalTextForEchoMatch('\x1b[1mRe\x1b[11;3Hsolve │ the-MERGE!')).toBe(
      'resolvethemerge'
    )
  })

  it('drops OSC title sequences entirely', () => {
    expect(foldTerminalTextForEchoMatch('\x1b]0;my secret title\x07visible')).toBe('visible')
  })
})

describe('createPromptEchoScanner', () => {
  it('detects the codex word-positioned verbatim echo', () => {
    expect(feedInChunks(CODEX_VERBATIM_ECHO, 4096)).toBe(true)
  })

  it('detects the claude column-positioned verbatim echo', () => {
    expect(feedInChunks(CLAUDE_VERBATIM_ECHO, 4096)).toBe(true)
  })

  it('detects the codex large-paste placeholder', () => {
    expect(feedInChunks(CODEX_LARGE_PLACEHOLDER, 4096)).toBe(true)
  })

  it('detects the claude large-paste placeholder', () => {
    expect(feedInChunks(CLAUDE_LARGE_PLACEHOLDER, 4096)).toBe(true)
  })

  it('does not fire on the codex trust-screen redraw that swallowed the paste', () => {
    expect(feedInChunks(CODEX_TRUST_SWALLOW_REDRAW, 4096)).toBe(false)
  })

  it('matches across chunk seams that split words and escape sequences', () => {
    for (const chunkSize of [1, 3, 7]) {
      expect(feedInChunks(CODEX_VERBATIM_ECHO, chunkSize)).toBe(true)
      expect(feedInChunks(CODEX_TRUST_SWALLOW_REDRAW, chunkSize)).toBe(false)
    }
  })

  it('matches the tail sample when only the end of the content renders', () => {
    const scanner = createPromptEchoScanner(PROMPT)
    expect(scanner.observe('…\x1b[11;3Hand report the final git status.')).toBe(true)
  })

  it('latches once echoed', () => {
    const scanner = createPromptEchoScanner(PROMPT)
    expect(scanner.observe(CODEX_VERBATIM_ECHO)).toBe(true)
    expect(scanner.observe('unrelated')).toBe(true)
  })

  it('treats content that folds below the minimum sample as echoed on any render', () => {
    const scanner = createPromptEchoScanner('!?— \n')
    expect(scanner.observe('any repaint at all')).toBe(true)
  })

  it('does not fire before any output arrives for unmatchable content', () => {
    const scanner = createPromptEchoScanner('!?— \n')
    expect(scanner.observe('')).toBe(false)
  })
})
