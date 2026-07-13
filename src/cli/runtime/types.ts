import type { RuntimeRpcFailure } from '../../shared/runtime-rpc-envelope'

export type {
  RuntimeRpcFailure,
  RuntimeRpcResponse,
  RuntimeRpcSuccess
} from '../../shared/runtime-rpc-envelope'

export class RuntimeClientError extends Error {
  readonly code: string
  // Why: optional structured recovery supports human hints and machine-safe
  // guidance; local JSON reporting strips presentation-only suggestions.
  readonly data?: unknown

  constructor(code: string, message: string, data?: unknown) {
    super(message)
    this.code = code
    this.data = data
  }
}

export class RuntimeRpcFailureError extends RuntimeClientError {
  readonly response: RuntimeRpcFailure

  constructor(response: RuntimeRpcFailure) {
    // Why: all client errors expose recovery through the same inherited channel.
    super(response.error.code, response.error.message, response.error.data)
    this.response = response
  }
}
