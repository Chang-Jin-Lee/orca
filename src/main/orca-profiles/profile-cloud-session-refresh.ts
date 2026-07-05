import type { OrcaCloudAuthConfig } from './profile-cloud-auth-config'
import type { ActiveOrcaProfileState } from './profile-index-store'
import {
  clearOrcaCloudSession,
  type OrcaCloudSession,
  readOrcaCloudSession,
  saveOrcaCloudSession
} from './profile-cloud-session-store'
import { OrcaCloudRequestError, refreshOrcaCloudSession } from './profile-cloud-client'
import { linkOrcaProfileToCloud } from './profile-cloud-index'

const CLOUD_SESSION_REFRESH_SKEW_MS = 60_000

export type FreshCloudSessionResult =
  | { status: 'found'; session: OrcaCloudSession }
  | { status: 'reconnect-required' }

export type CloudSessionOperationResult<T> =
  | { status: 'ok'; value: T }
  | { status: 'reconnect-required' }

function shouldRefreshCloudSession(session: OrcaCloudSession, now = Date.now()): boolean {
  return session.expiresAt <= now + CLOUD_SESSION_REFRESH_SKEW_MS
}

export function isOrcaCloudAuthFailure(error: unknown): boolean {
  return (
    error instanceof OrcaCloudRequestError &&
    (error.statusCode === 401 || error.statusCode === 403)
  )
}

async function refreshStoredCloudSession(
  config: OrcaCloudAuthConfig,
  active: ActiveOrcaProfileState,
  userDataPath: string,
  session: OrcaCloudSession
): Promise<OrcaCloudSession> {
  const refreshed = await refreshOrcaCloudSession(config, session)
  const nextSession = {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
    organizations: refreshed.organizations,
    capabilities: refreshed.capabilities
  }
  saveOrcaCloudSession(active.profile.id, userDataPath, nextSession)
  linkOrcaProfileToCloud(active.profile.id, refreshed.cloud, userDataPath)
  return nextSession
}

export async function readFreshOrcaCloudSession(
  config: OrcaCloudAuthConfig,
  active: ActiveOrcaProfileState,
  userDataPath: string
): Promise<FreshCloudSessionResult> {
  const session = readOrcaCloudSession(active.profile.id, userDataPath)
  if (session.status !== 'found') {
    return { status: 'reconnect-required' }
  }
  if (!shouldRefreshCloudSession(session.session)) {
    return { status: 'found', session: session.session }
  }
  try {
    return {
      status: 'found',
      session: await refreshStoredCloudSession(config, active, userDataPath, session.session)
    }
  } catch (error) {
    if (
      error instanceof OrcaCloudRequestError &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      clearOrcaCloudSession(active.profile.id, userDataPath)
      return { status: 'reconnect-required' }
    }
    throw error
  }
}

export async function forceRefreshOrcaCloudSession(
  config: OrcaCloudAuthConfig,
  active: ActiveOrcaProfileState,
  userDataPath: string,
  session: OrcaCloudSession
): Promise<FreshCloudSessionResult> {
  try {
    return {
      status: 'found',
      session: await refreshStoredCloudSession(config, active, userDataPath, session)
    }
  } catch (error) {
    if (isOrcaCloudAuthFailure(error)) {
      clearOrcaCloudSession(active.profile.id, userDataPath)
      return { status: 'reconnect-required' }
    }
    throw error
  }
}

export async function runWithFreshOrcaCloudSession<T>(
  config: OrcaCloudAuthConfig,
  active: ActiveOrcaProfileState,
  userDataPath: string,
  operation: (session: OrcaCloudSession) => Promise<T>
): Promise<CloudSessionOperationResult<T>> {
  const session = await readFreshOrcaCloudSession(config, active, userDataPath)
  if (session.status !== 'found') {
    return { status: 'reconnect-required' }
  }
  try {
    return { status: 'ok', value: await operation(session.session) }
  } catch (error) {
    if (!isOrcaCloudAuthFailure(error)) {
      throw error
    }
    const refreshed = await forceRefreshOrcaCloudSession(
      config,
      active,
      userDataPath,
      session.session
    )
    if (refreshed.status !== 'found') {
      return { status: 'reconnect-required' }
    }
    try {
      return { status: 'ok', value: await operation(refreshed.session) }
    } catch (retryError) {
      if (isOrcaCloudAuthFailure(retryError)) {
        clearOrcaCloudSession(active.profile.id, userDataPath)
        return { status: 'reconnect-required' }
      }
      throw retryError
    }
  }
}
