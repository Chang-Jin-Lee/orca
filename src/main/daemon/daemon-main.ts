import { DaemonServer, type DaemonServerOptions } from './daemon-server'
import type { DaemonFileLog } from './daemon-file-log'

export type DaemonStartOptions = {
  socketPath: string
  tokenPath: string
  spawnSubprocess: DaemonServerOptions['spawnSubprocess']
  log?: DaemonFileLog
  requestProcessExit?: DaemonServerOptions['requestProcessExit']
}

export type DaemonHandle = {
  shutdown(): Promise<void>
}

export async function startDaemon(opts: DaemonStartOptions): Promise<DaemonHandle> {
  const server = new DaemonServer({
    socketPath: opts.socketPath,
    tokenPath: opts.tokenPath,
    spawnSubprocess: opts.spawnSubprocess,
    ...(opts.log ? { log: opts.log } : {}),
    ...(opts.requestProcessExit ? { requestProcessExit: opts.requestProcessExit } : {})
  })

  await server.start()

  return {
    shutdown: () => server.shutdown()
  }
}
