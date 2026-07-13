import { callRuntimeRpc, type RuntimeClientTarget } from '@/runtime/runtime-rpc-client'

type EnvironmentTarget = Extract<RuntimeClientTarget, { kind: 'environment' }>

export function closeRuntimeTerminalRetainingRetryOwnership(
  target: EnvironmentTarget,
  handle: string
): Promise<void> {
  // Why: main owns durable retry intent, so renderer loss cannot orphan the handle.
  return callRuntimeRpc(target, 'terminal.close', { terminal: handle })
}

export function retryRetainedRuntimeTerminalCloses(): void {
  // Main retries on provider availability and bounded backoff.
}

export function releaseRetainedRuntimeTerminalClose(
  target: EnvironmentTarget,
  handle: string
): void {
  void target
  void handle
}

export function releaseRetainedRuntimeTerminalClosesForEnvironment(environmentId: string): void {
  void environmentId
}
