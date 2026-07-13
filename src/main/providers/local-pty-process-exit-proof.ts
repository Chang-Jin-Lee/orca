export function isLocalPtyProcessProvablyExited(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    return false
  }
  try {
    process.kill(pid, 0)
    return false
  } catch (error) {
    // Why: only ESRCH proves absence; EPERM and every other probe failure must
    // retain the exact native owner for a later retry.
    return (error as NodeJS.ErrnoException).code === 'ESRCH'
  }
}
