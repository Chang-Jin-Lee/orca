import { applyPatches, makePatches } from '@sanity/diff-match-patch'

// Why: bound the safety re-parse cost — it builds a throwaway TipTap editor per
// commit, whose parse time scales with document length (UTF-16 code units, the
// unit `.length` returns and the closest cheap proxy for parse cost — not UTF-8
// bytes). Measured ~50-67ms at the cap on fast HW (higher on low-end/SSH), under
// the 300ms serialize debounce; a higher cap risks a main-thread stall on
// slow/SSH hosts. Above the cap we use today's canonical output (no regression).
const RECONCILE_SIZE_CAP_CODE_UNITS = 50_000

export type ReconcileSerializedMarkdownParams = {
  /** Current on-disk source bytes (possibly non-canonical, possibly CRLF). */
  originalSource: string
  /** Canonical serialization of `originalSource` (what getMarkdown returns unedited). */
  baseCanonical: string
  /** Canonical serialization after the user's edit (getMarkdown, always LF). */
  edited: string
  /**
   * Re-serializes reconciled bytes through the live editor's pipeline. Injected
   * so the reconcile logic is unit-testable without a DOM. Returns null when the
   * throwaway serializer fails (treated as a safety mismatch → canonical fallback).
   */
  roundTrip: (markdown: string) => string | null
}

/**
 * Carries the user's edit into the original source style so untouched regions
 * keep their non-canonical bytes. Falls back to the canonical `edited` output
 * (today's behavior) whenever the source-preserving transform cannot be proven
 * render-equivalent — so it can never corrupt or relocate content.
 */
export function reconcileSerializedMarkdown({
  originalSource,
  baseCanonical,
  edited,
  roundTrip
}: ReconcileSerializedMarkdownParams): string {
  // Branch 1: no semantic change vs the unedited doc → preserve the original
  // bytes verbatim (incl. trailing newline / EOL); zero disk churn.
  if (edited === baseCanonical) {
    return originalSource
  }

  // Work in LF space: getMarkdown emits LF while `originalSource` may be CRLF, so
  // patching LF-context hunks against raw CRLF would fuzzy-match poorly and mix
  // endings. The detected EOL is restored on EVERY non-verbatim return below so a
  // uniform-CRLF file never silently flips to LF, even on a canonical fallback.
  const eol = detectDominantEol(originalSource)
  const originalSourceLf = toLf(originalSource)
  const baseLf = toLf(baseCanonical)
  const editedLf = toLf(edited)

  // Branch 2: the source body equals the canonical `edited` body apart from its
  // EOL/trailing newlines, so nothing non-canonical remains to preserve. Skip the
  // expensive safety re-parse and carry the source's EOL + trailing newline onto
  // the edit. Two guards keep the re-parse skip provably drift-free:
  //  - source trailing run ≤ 1 newline: a longer trailing-blank run can
  //    materialize a spurious `&nbsp;` empty paragraph on reload when the edit
  //    turns the EOF block into a paragraph;
  //  - `edited` has no trailing newline: getMarkdown keeps a trailing `\n\n` for a
  //    real trailing empty paragraph, so stripping it here would silently drop a
  //    block the user added.
  // Both cases (rare) defer to the branch-6-verified path below instead.
  const originalTrailingNewlines = originalSourceLf.match(/\n+$/)?.[0] ?? ''
  if (
    originalTrailingNewlines.length <= 1 &&
    !editedLf.endsWith('\n') &&
    stripTrailingNewlines(originalSourceLf) === stripTrailingNewlines(baseLf)
  ) {
    return restoreEol(editedLf + originalTrailingNewlines, eol)
  }

  // Branch 3: oversize → bounded-cost canonical fallback (today's behavior).
  if (
    Math.max(originalSource.length, baseCanonical.length, edited.length) >
    RECONCILE_SIZE_CAP_CODE_UNITS
  ) {
    return restoreEol(editedLf, eol)
  }

  // Branch 4: run the divergent-base patch entirely in LF space.
  const patches = makePatches(baseLf, editedLf)
  const [reconciledLf, results] = applyPatches(patches, originalSourceLf)

  // Branch 5: a hunk that failed to locate in the non-canonical source → the
  // fuzzy match is unreliable here, so fall back to canonical.
  if (results.some((applied) => !applied)) {
    return restoreEol(editedLf, eol)
  }

  // Branch 6: prove the reconciled bytes render-equal the editor's document.
  // Any fuzzy misplacement (e.g. onto a repeated substring) changes canonical
  // output and is caught here → canonical fallback. Compared under norm so only
  // style/EOL/EOF differences are tolerated.
  const reparsed = roundTrip(reconciledLf)
  if (reparsed === null || normalizeForSafety(reparsed) !== normalizeForSafety(editedLf)) {
    return restoreEol(editedLf, eol)
  }

  // Restore the detected EOL as the final step so reconciled CRLF stays CRLF.
  return restoreEol(reconciledLf, eol)
}

function stripTrailingNewlines(lfText: string): string {
  return lfText.replace(/\n+$/, '')
}

function detectDominantEol(text: string): '\n' | '\r\n' {
  const totalLf = (text.match(/\n/g) ?? []).length
  const crlf = (text.match(/\r\n/g) ?? []).length
  const lfOnly = totalLf - crlf
  return crlf > 0 && crlf >= lfOnly ? '\r\n' : '\n'
}

function toLf(text: string): string {
  return text.replace(/\r\n/g, '\n')
}

function restoreEol(lfText: string, eol: '\n' | '\r\n'): string {
  // lfText is pure LF, so a blind LF→CRLF replace produces no mixed endings.
  return eol === '\r\n' ? lfText.replace(/\n/g, '\r\n') : lfText
}

function normalizeForSafety(text: string): string {
  // Why: both operands are canonical getMarkdown outputs, so an equal-render
  // reconciliation is byte-identical here apart from EOL. Compare exactly (only
  // CRLF-normalized) — a trailing `\n\n` empty paragraph is semantic, so a lenient
  // trimEnd would mask exactly the trailing-block drift branch 6 must catch.
  return text.replace(/\r\n/g, '\n')
}
