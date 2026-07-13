import { callRuntimeRpc, type RuntimeClientTarget } from '@/runtime/runtime-rpc-client'

type EnvironmentTarget = Extract<RuntimeClientTarget, { kind: 'environment' }>

export function closeRuntimeTerminalRetainingRetryOwnership(
  target: EnvironmentTarget,
  handle: string
): Promise<void> {
  // Why: main owns durable retry intent, so renderer loss cannot orphan the handle.
  return callRuntimeRpc(target, 'terminal.close', { terminal: handle })
}
