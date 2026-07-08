// Why: "paste bytes were written" is not proof the agent's composer received
// them — codex's trust/update screens and claude's login screen silently
// swallow pastes after the readiness heuristics fire (issue #7466). This
// scanner watches the PTY output for visible evidence the pasted content
// rendered, so callers can withhold the submit Enter until delivery is real.

/**
 * Fold terminal output down to comparable text:
 *   - strip OSC (title/hyperlink) and CSI/charset escape sequences
 *   - drop every non-letter/non-number character (TUIs repaint with cursor
 *     moves instead of literal spaces, wrap lines at pane width, and draw box
 *     borders through the text, so only the letters/digits survive intact).
 *     Uses the Unicode letter/number classes rather than ASCII so non-Latin
 *     prompts (Cyrillic, CJK, Arabic, ...) still fold to matchable content
 *     instead of vanishing to nothing.
 *   - lowercase for case-stable matching
 */
export function foldTerminalTextForEchoMatch(raw: string): string {
  /* oxlint-disable no-control-regex -- grammar matches terminal ESC/BEL sequences by definition */
  const withoutEscapes = raw
    // OSC ... BEL | OSC ... ST
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    // CSI sequences (parameters + final byte)
    .replace(/\x1b\[[0-9;:?<=>]*[ -/]*[@-~]/g, '')
    // charset selection / keypad / other two-byte escapes
    .replace(/\x1b[()#][0-9A-Za-z]/g, '')
    .replace(/\x1b[@-_]/g, '')
  /* oxlint-enable no-control-regex */
  return withoutEscapes.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

// Why: large pastes never render verbatim — codex collapses to
// "[Pasted Content 4295 chars]" and claude to "[Pasted text #1 +39 lines]"
// (captured from real PTYs). After folding, both start with "pasted".
const FOLDED_PLACEHOLDER_PATTERNS = [/pastedcontent\d+chars/, /pastedtext\d+/]

const SAMPLE_LENGTH = 24
// Why: refold the whole raw ring on every chunk instead of delta-folding —
// escape sequences straddling chunk seams make incremental folds misalign,
// and the scanner only lives for the few seconds after one paste, so the
// bounded rescan is cheap. The ring comfortably exceeds one composer repaint.
const RAW_RING_LIMIT = 32_768

export type PromptEchoScanner = {
  /** Feed a PTY output chunk; returns true once the pasted content (or the
   * agent's paste placeholder) has visibly rendered. Latches once true. */
  observe: (chunk: string) => boolean
}

export function createPromptEchoScanner(pastedContent: string): PromptEchoScanner {
  const folded = foldTerminalTextForEchoMatch(pastedContent)
  const head = folded.slice(0, SAMPLE_LENGTH)
  const tail = folded.length > SAMPLE_LENGTH ? folded.slice(-SAMPLE_LENGTH) : ''
  // Why: only content that folds to nothing (punctuation/whitespace-only
  // prompts) is genuinely impossible to match — treat any post-paste render as
  // echo there rather than blocking delivery forever. Short-but-nonempty
  // prompts (e.g. "fix ci") must still match on the head sample below so a
  // swallow screen that renders none of their characters withholds the submit
  // (#7466); firing on an arbitrary redraw would resubmit the exact bug.
  const unmatchable = folded.length === 0

  let rawRing = ''
  let echoed = false

  return {
    observe(chunk: string): boolean {
      if (echoed) {
        return true
      }
      if (unmatchable) {
        echoed = chunk.length > 0
        return echoed
      }
      rawRing = (rawRing + chunk).slice(-RAW_RING_LIMIT)
      const foldedRing = foldTerminalTextForEchoMatch(rawRing)
      if (foldedRing.includes(head) || (tail !== '' && foldedRing.includes(tail))) {
        echoed = true
        return true
      }
      if (FOLDED_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(foldedRing))) {
        echoed = true
        return true
      }
      return false
    }
  }
}
