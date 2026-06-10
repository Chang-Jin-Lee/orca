// Default-driven create-project state for AddRepoDialog: resolves the default
// parent (local/runtime host home) and probes Git
// availability, guarding against stale async results when the target changes.
import { useCallback, useEffect, useRef, useState } from 'react'
import { browseRuntimeServerDirectory } from '@/runtime/runtime-server-directory-browser'
import { callRuntimeRpc } from '@/runtime/runtime-rpc-client'
import type { AddRepoDialogStep } from './add-repo-dialog-types'
import {
  getCreateProjectDefaultParentAutoFill,
  getDefaultCreateProjectParent,
  type GitAvailability,
  type RepoKind
} from './create-project-defaults'

const LOCAL_GIT_AVAILABILITY_TIMEOUT_MS = 1500
const RUNTIME_GIT_AVAILABILITY_TIMEOUT_MS = 3000

export type CreateRuntimeParentStatus = 'idle' | 'checking' | 'failed'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return new Promise<T>((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('Timed out')), timeoutMs)
    promise.then(
      (value) => {
        if (timeout) {
          clearTimeout(timeout)
        }
        resolve(value)
      },
      (error) => {
        if (timeout) {
          clearTimeout(timeout)
        }
        reject(error)
      }
    )
  })
}

export function useCreateProjectDefaults({
  step,
  activeRuntimeEnvironmentId,
  createParent,
  setCreateParent,
  setCreateKind
}: {
  step: AddRepoDialogStep
  activeRuntimeEnvironmentId: string | null | undefined
  createParent: string
  setCreateParent: (value: string) => void
  setCreateKind: (kind: RepoKind) => void
}): {
  createDefaultParent: string
  createGitAvailability: GitAvailability
  createRuntimeParentStatus: CreateRuntimeParentStatus
  resetCreateDefaultState: () => void
  markCreateParentTouched: () => void
  markCreateKindTouched: () => void
} {
  const [createDefaultParent, setCreateDefaultParent] = useState('')
  const [createGitAvailability, setCreateGitAvailability] = useState<GitAvailability>('unknown')
  const [createRuntimeParentStatus, setCreateRuntimeParentStatus] =
    useState<CreateRuntimeParentStatus>('idle')
  const createStepAutoFilledRef = useRef(false)
  const createParentTouchedRef = useRef(false)
  const createKindTouchedRef = useRef(false)
  const createParentDefaultGenRef = useRef(0)
  const createGitProbeGenRef = useRef(0)

  const resetCreateDefaultState = useCallback(() => {
    createParentDefaultGenRef.current++
    createGitProbeGenRef.current++
    createStepAutoFilledRef.current = false
    createParentTouchedRef.current = false
    createKindTouchedRef.current = false
    setCreateDefaultParent('')
    setCreateGitAvailability('unknown')
    setCreateRuntimeParentStatus('idle')
  }, [])

  // Why: a default must never clobber a parent or kind the user picked themselves.
  const markCreateParentTouched = useCallback(() => {
    createParentTouchedRef.current = true
  }, [])
  const markCreateKindTouched = useCallback(() => {
    createKindTouchedRef.current = true
  }, [])

  useEffect(() => {
    if (step !== 'create') {
      return
    }
    if (activeRuntimeEnvironmentId?.trim()) {
      return
    }
    // Why: invalidate any in-flight runtime parent probe once local mode owns the default.
    const gen = ++createParentDefaultGenRef.current
    if (createParent.trim() || createParentTouchedRef.current) {
      return
    }
    setCreateDefaultParent('')
    void window.api.repos
      .getDefaultCreateProjectParent()
      .then((parent) => {
        const autoFill = getCreateProjectDefaultParentAutoFill({
          step,
          createParent,
          activeRuntimeEnvironmentId,
          defaultParent: parent,
          createStepAutoFilled: createStepAutoFilledRef.current || createParentTouchedRef.current
        })
        if (
          gen !== createParentDefaultGenRef.current ||
          createParentTouchedRef.current ||
          createParent.trim() ||
          !autoFill
        ) {
          return
        }
        setCreateDefaultParent(parent)
        createStepAutoFilledRef.current = true
        setCreateParent(autoFill.parent)
      })
      .catch(() => {
        // Keep the field empty if the local host cannot provide a submit-ready default.
      })
  }, [activeRuntimeEnvironmentId, createParent, setCreateParent, step])

  useEffect(() => {
    if (step !== 'create') {
      return
    }
    const runtimeEnvironmentId = activeRuntimeEnvironmentId?.trim()
    if (!runtimeEnvironmentId) {
      setCreateRuntimeParentStatus('idle')
      return
    }
    if (createParent.trim() || createParentTouchedRef.current) {
      setCreateRuntimeParentStatus('idle')
      return
    }
    setCreateDefaultParent('')

    const gen = ++createParentDefaultGenRef.current
    setCreateRuntimeParentStatus('checking')
    void withTimeout(
      browseRuntimeServerDirectory(runtimeEnvironmentId, '~'),
      RUNTIME_GIT_AVAILABILITY_TIMEOUT_MS
    )
      .then((result) => {
        if (
          gen !== createParentDefaultGenRef.current ||
          createParentTouchedRef.current ||
          createParent.trim()
        ) {
          return
        }
        const parent = getDefaultCreateProjectParent(result.resolvedPath)
        createStepAutoFilledRef.current = true
        setCreateDefaultParent(parent)
        setCreateParent(parent)
        setCreateRuntimeParentStatus('idle')
      })
      .catch(() => {
        if (gen !== createParentDefaultGenRef.current) {
          return
        }
        setCreateRuntimeParentStatus('failed')
      })
  }, [activeRuntimeEnvironmentId, createParent, setCreateParent, step])

  useEffect(() => {
    if (step !== 'create') {
      return
    }
    const runtimeEnvironmentId = activeRuntimeEnvironmentId?.trim()
    const gen = ++createGitProbeGenRef.current
    setCreateGitAvailability('checking')
    const probe = runtimeEnvironmentId
      ? callRuntimeRpc<{ available: boolean }>(
          { kind: 'environment', environmentId: runtimeEnvironmentId },
          'repo.gitAvailable',
          undefined,
          { timeoutMs: RUNTIME_GIT_AVAILABILITY_TIMEOUT_MS }
        ).then((result) => result.available)
      : window.api.repos.isGitAvailable()
    const timeoutMs = runtimeEnvironmentId
      ? RUNTIME_GIT_AVAILABILITY_TIMEOUT_MS
      : LOCAL_GIT_AVAILABILITY_TIMEOUT_MS

    void withTimeout(probe, timeoutMs)
      .then((available) => {
        if (gen !== createGitProbeGenRef.current) {
          return
        }
        setCreateGitAvailability(available ? 'available' : 'unavailable')
        if (createKindTouchedRef.current) {
          return
        }
        setCreateKind(available ? 'git' : 'folder')
      })
      .catch(() => {
        if (gen !== createGitProbeGenRef.current) {
          return
        }
        setCreateGitAvailability('unknown')
      })
  }, [activeRuntimeEnvironmentId, setCreateKind, step])

  return {
    createDefaultParent,
    createGitAvailability,
    createRuntimeParentStatus,
    resetCreateDefaultState,
    markCreateParentTouched,
    markCreateKindTouched
  }
}
