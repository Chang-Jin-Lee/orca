// Simulates a TUI that armed mouse tracking and then died uncleanly: it emits
// the enable sequence to stdout and exits WITHOUT the matching disable, so the
// daemon's private-mode tracker keeps the mode and buildRehydrateSequences
// re-arms it on every reattach. The reattach reset must clear it, or a plain
// shell echoes pointer-motion reports as literal text. Regression fixture for
// the mouse-mode leak fixed alongside #7329.
const ESC = '\x1b'

// ?1003h any-motion tracking + ?1006h SGR encoding, with no ?1003l/?1006l.
process.stdout.write(`${ESC}[?1003h${ESC}[?1006h`)
