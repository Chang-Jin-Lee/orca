import { cn } from '@/lib/utils'

// Why: bg-background in dark mode is the same color as the canvas, and
// border-border/50 is ~3.5% white over that canvas — both invisible. A
// translucent surface, solid 14% border, dual shadow, and 2xl backdrop blur
// match the dropdown-menu recipe (which already works) and read clearly in both
// light and dark mode.
const DIALOG_CONTENT_BASE_CLASS =
  'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-black/14 bg-background/96 p-6 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl duration-200 outline-none dark:border-white/14 dark:bg-[rgba(23,23,23,0.96)] dark:shadow-[0_24px_72px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'

/** The default desktop width cap. Applied only when the caller sets no
 *  max-width of their own (see resolveDialogContentClassName). */
const DIALOG_CONTENT_DEFAULT_MAX_WIDTH = 'sm:max-w-lg'

/** Matches a Tailwind `max-w-*` utility in a className string, with or without a
 *  variant prefix (`sm:`) or important (`!`) modifier. */
const CALLER_MAX_WIDTH = /(?:^|[\s:!])max-w-/

/**
 * Compose the DialogContent className.
 *
 * The default cap is `sm:max-w-lg`, but because it is scoped to the `sm`
 * breakpoint, a caller's unprefixed `max-w-*` lands in a different responsive
 * bucket and tailwind-merge keeps both — so the default silently wins at ≥sm and
 * the caller's width is ignored on desktop. Applying the default only when the
 * caller has not set their own max-width lets a bare `className="max-w-md"` win
 * at every breakpoint, while leaving callers that pass no width (default cap) or
 * an `sm:`-prefixed width (already overrode the default) byte-for-byte unchanged.
 */
export function resolveDialogContentClassName(className?: string): string {
  const hasCallerMaxWidth = className ? CALLER_MAX_WIDTH.test(className) : false
  return cn(
    DIALOG_CONTENT_BASE_CLASS,
    !hasCallerMaxWidth && DIALOG_CONTENT_DEFAULT_MAX_WIDTH,
    className
  )
}
