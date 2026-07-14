import type { SshRemotePtyLease } from '../../shared/ssh-types'

export function sshRemotePtyLeaseIdentityKey(
  targetId: string,
  ptyId: string,
  relayInstanceId?: string
): string {
  return JSON.stringify([targetId, ptyId, relayInstanceId ?? null])
}

export function indexSshRemotePtyLeases(
  leases: SshRemotePtyLease[]
): Map<string, SshRemotePtyLease> {
  return new Map(
    leases.map((lease) => [
      sshRemotePtyLeaseIdentityKey(lease.targetId, lease.ptyId, lease.relayInstanceId),
      lease
    ])
  )
}
