import type { GlobalSettings } from '../../../shared/types'
import { subscribeToPtyData } from '@/components/terminal-pane/pty-data-sidecar-subscriptions'
import { isRemoteRuntimePtyId } from '@/runtime/runtime-terminal-inspection'
import { subscribeToRuntimeTerminalData } from '@/runtime/runtime-terminal-stream'
import { createPromptEchoScanner } from '../../../shared/prompt-echo-scanner'

export type PromptEchoWatch = {
  /** Resolves true once the pasted content visibly renders; false on timeout/cancel. */
  result: Promise<boolean>
  /** Stop watching early (e.g. the paste write itself failed). */
  cancel: () => void
}

/**
 * Tap the PTY data stream as a sidecar observer and resolve once the pasted
 * content (or the agent's paste placeholder) renders. Start the watch BEFORE
 * writing the paste so a fast echo cannot slip past the subscription.
 *
 * Same transport split as waitForAgentDraftInputReady: local PTYs use the
 * dispatcher sidecar; remote runtime PTYs subscribe through the host stream.
 */
export function watchForPromptEcho(
  ptyId: string,
  pastedContent: string,
  timeoutMs: number,
  settings: Pick<GlobalSettings, 'activeRuntimeEnvironmentId'> | null | undefined
): PromptEchoWatch {
  let cancel: () => void = () => {}
  const result = new Promise<boolean>((resolve) => {
    let settled = false
    const scanner = createPromptEchoScanner(pastedContent)
    let hardTimer: number | null = null
    let unsubscribe: (() => void) | null = null

    const finish = (value: boolean): void => {
      if (settled) {
        return
      }
      settled = true
      if (hardTimer !== null) {
        window.clearTimeout(hardTimer)
      }
      unsubscribe?.()
      resolve(value)
    }
    cancel = () => finish(false)

    const observeData = (data: string): void => {
      if (scanner.observe(data)) {
        finish(true)
      }
    }

    if (isRemoteRuntimePtyId(ptyId)) {
      void subscribeToRuntimeTerminalData(
        settings,
        ptyId,
        `desktop:prompt-echo:${ptyId}`,
        observeData
      )
        .then((remoteUnsubscribe) => {
          if (settled) {
            remoteUnsubscribe()
            return
          }
          unsubscribe = remoteUnsubscribe
        })
        .catch(() => finish(false))
    } else {
      unsubscribe = subscribeToPtyData(ptyId, observeData)
    }

    if (!settled) {
      hardTimer = window.setTimeout(() => finish(false), timeoutMs)
    }
  })
  return { result, cancel }
}
