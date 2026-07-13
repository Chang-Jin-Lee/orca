const operationQueues = new Map<string, Promise<void>>()

function normalizeDistro(distro: string): string {
  return distro.trim().toLowerCase()
}

/**
 * Serializes registration reads and mutations for one WSL distro.
 */
export function runSerializedWslCliRegistrationOperation<T>(
  distro: string,
  operation: () => Promise<T>
): Promise<T> {
  // Why: startup repair continues in the background and can otherwise undo a
  // concurrent Settings install/remove or overwrite its ownership metadata.
  const key = normalizeDistro(distro)
  const previous = operationQueues.get(key) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(operation)
  const queued = current.then(
    () => undefined,
    () => undefined
  )
  operationQueues.set(key, queued)

  const clear = (): void => {
    if (operationQueues.get(key) === queued) {
      operationQueues.delete(key)
    }
  }
  queued.then(clear, clear)
  return current
}
