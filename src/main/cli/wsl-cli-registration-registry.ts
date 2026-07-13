import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const REGISTRY_FILE_NAME = 'wsl-cli-registrations.json'
const REGISTRY_SCHEMA_VERSION = 2
const DEFAULT_NEGATIVE_INSPECTION_TTL_MS = 7 * 24 * 60 * 60 * 1_000

type WslCliRegistrationRegistryState = {
  schemaVersion: 2
  registeredDistros: string[]
  inspectedDistros: string[]
  inspectionTimes: Record<string, number>
}

type WslCliRegistrationRegistryTiming = {
  now?: number
  negativeInspectionTtlMs?: number
}

export type WslCliRegistrationObservation = {
  distro: string
  inspected: boolean
  managed: boolean
}

const writeQueues = new Map<string, Promise<void>>()

type WslCliRegistrationRegistryInvalidationOptions = {
  removeFile?: (filePath: string, options: { force: true }) => Promise<void>
}

function emptyState(): WslCliRegistrationRegistryState {
  return {
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    registeredDistros: [],
    inspectedDistros: [],
    inspectionTimes: {}
  }
}

function normalizeDistro(distro: string): string {
  return distro.trim().toLowerCase()
}

function uniqueDistros(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set<string>()
  const distros: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }
    const distro = entry.trim()
    const key = normalizeDistro(distro)
    if (!seen.has(key)) {
      seen.add(key)
      distros.push(distro)
    }
  }
  return distros
}

function parseState(content: string): WslCliRegistrationRegistryState {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== REGISTRY_SCHEMA_VERSION) {
      return emptyState()
    }
    const inspectionTimes =
      parsed.inspectionTimes && typeof parsed.inspectionTimes === 'object'
        ? Object.fromEntries(
            Object.entries(parsed.inspectionTimes).filter(
              (entry): entry is [string, number] =>
                typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0
            )
          )
        : {}
    return {
      schemaVersion: REGISTRY_SCHEMA_VERSION,
      registeredDistros: uniqueDistros(parsed.registeredDistros),
      inspectedDistros: uniqueDistros(parsed.inspectedDistros),
      inspectionTimes
    }
  } catch {
    // Why: a corrupt advisory registry must trigger safe rediscovery rather
    // than preventing managed registrations from receiving future updates.
    return emptyState()
  }
}

function isMissingError(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT'
}

function getRegistryPath(userDataPath: string): string {
  return join(userDataPath, REGISTRY_FILE_NAME)
}

async function readState(userDataPath: string): Promise<WslCliRegistrationRegistryState> {
  try {
    return parseState(await readFile(getRegistryPath(userDataPath), 'utf8'))
  } catch (error) {
    if (isMissingError(error)) {
      return emptyState()
    }
    throw error
  }
}

function upsertDistro(distros: string[], distro: string): string[] {
  const key = normalizeDistro(distro)
  const existingIndex = distros.findIndex((entry) => normalizeDistro(entry) === key)
  if (existingIndex < 0) {
    return [...distros, distro.trim()]
  }
  return distros.map((entry, index) => (index === existingIndex ? distro.trim() : entry))
}

function removeDistro(distros: string[], distro: string): string[] {
  const key = normalizeDistro(distro)
  return distros.filter((entry) => normalizeDistro(entry) !== key)
}

async function writeState(
  userDataPath: string,
  state: WslCliRegistrationRegistryState
): Promise<void> {
  await mkdir(userDataPath, { recursive: true })
  const registryPath = getRegistryPath(userDataPath)
  const temporaryPath = `${registryPath}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  let renamed = false
  try {
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, registryPath)
    renamed = true
  } finally {
    if (!renamed) {
      await rm(temporaryPath, { force: true }).catch(() => {})
    }
  }
}

function enqueueRegistryOperation(
  userDataPath: string,
  operation: () => Promise<void>
): Promise<void> {
  const registryPath = getRegistryPath(userDataPath)
  const previous = writeQueues.get(registryPath) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(operation)
  writeQueues.set(registryPath, current)
  const clear = (): void => {
    if (writeQueues.get(registryPath) === current) {
      writeQueues.delete(registryPath)
    }
  }
  current.then(clear, clear)
  return current
}

function updateState(
  userDataPath: string,
  update: (state: WslCliRegistrationRegistryState) => WslCliRegistrationRegistryState
): Promise<void> {
  return enqueueRegistryOperation(userDataPath, async () => {
    await writeState(userDataPath, update(await readState(userDataPath)))
  })
}

export async function getWslCliRegistrationCandidates(
  userDataPath: string,
  availableDistros: string[],
  timing: WslCliRegistrationRegistryTiming = {}
): Promise<string[]> {
  await writeQueues.get(getRegistryPath(userDataPath))
  const state = await readState(userDataPath)
  const registered = new Set(state.registeredDistros.map(normalizeDistro))
  const inspected = new Set(state.inspectedDistros.map(normalizeDistro))
  const now = timing.now ?? Date.now()
  const negativeInspectionTtlMs =
    timing.negativeInspectionTtlMs ?? DEFAULT_NEGATIVE_INSPECTION_TTL_MS
  return uniqueDistros(availableDistros).filter((distro) => {
    const key = normalizeDistro(distro)
    const inspectedAt = state.inspectionTimes[key]
    const negativeInspectionExpired =
      inspectedAt === undefined || inspectedAt > now || now - inspectedAt >= negativeInspectionTtlMs
    return registered.has(key) || !inspected.has(key) || negativeInspectionExpired
  })
}

export function recordWslCliRegistrationObservations(
  userDataPath: string,
  observations: WslCliRegistrationObservation[],
  timing: Pick<WslCliRegistrationRegistryTiming, 'now'> = {}
): Promise<void> {
  if (observations.length === 0) {
    return Promise.resolve()
  }
  return updateState(userDataPath, (state) => {
    let registeredDistros = state.registeredDistros
    let inspectedDistros = state.inspectedDistros
    let inspectionTimes = state.inspectionTimes
    const now = timing.now ?? Date.now()
    for (const observation of observations) {
      if (!observation.inspected || !observation.distro.trim()) {
        continue
      }
      inspectedDistros = upsertDistro(inspectedDistros, observation.distro)
      inspectionTimes = { ...inspectionTimes, [normalizeDistro(observation.distro)]: now }
      registeredDistros = observation.managed
        ? upsertDistro(registeredDistros, observation.distro)
        : removeDistro(registeredDistros, observation.distro)
    }
    return {
      schemaVersion: REGISTRY_SCHEMA_VERSION,
      registeredDistros,
      inspectedDistros,
      inspectionTimes
    }
  })
}

export function recordWslCliRegistrationInstalled(
  userDataPath: string,
  distro: string
): Promise<void> {
  return recordWslCliRegistrationObservations(userDataPath, [
    { distro, inspected: true, managed: true }
  ])
}

export function recordWslCliRegistrationRemoved(
  userDataPath: string,
  distro: string
): Promise<void> {
  return recordWslCliRegistrationObservations(userDataPath, [
    { distro, inspected: true, managed: false }
  ])
}

export function invalidateWslCliRegistrationRegistry(
  userDataPath: string,
  options: WslCliRegistrationRegistryInvalidationOptions = {}
): Promise<void> {
  const registryPath = getRegistryPath(userDataPath)
  // Why: the registry is advisory; deleting stale discovery state makes the
  // next startup rediscover ownership, and serialization prevents deleting a
  // newer successful Settings update that starts while invalidation is pending.
  return enqueueRegistryOperation(userDataPath, () =>
    (options.removeFile ?? rm)(registryPath, { force: true })
  )
}
