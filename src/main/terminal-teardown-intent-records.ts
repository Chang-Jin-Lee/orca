import { z } from 'zod'
import type { PersistedLocalPtyShutdown, PersistedRuntimeTerminalClose } from '../shared/types'

const nonEmptyString = z.string().min(1)
const timestamp = z.number().finite().nonnegative()
const localShutdownSchema = z
  .object({
    ptyId: nonEmptyString,
    expectedPaneKey: nonEmptyString.optional(),
    expectedTabId: nonEmptyString.optional(),
    requestedAt: timestamp
  })
  .strict()
const runtimeCloseSchema = z
  .object({
    environmentId: nonEmptyString,
    handle: nonEmptyString,
    runtimeId: nonEmptyString.optional(),
    requestedAt: timestamp
  })
  .strict()
const sshShutdownSchema = z
  .object({
    targetId: nonEmptyString,
    ptyId: nonEmptyString,
    relayInstanceId: nonEmptyString.optional(),
    shutdownRequestedAt: timestamp
  })
  .strict()

export const terminalTeardownIntentSnapshotSchema = z
  .object({
    version: z.literal(1),
    revision: z.number().int().nonnegative(),
    pendingLocalPtyShutdowns: z.array(localShutdownSchema),
    pendingRuntimeTerminalCloses: z.array(runtimeCloseSchema),
    pendingSshPtyShutdowns: z.array(sshShutdownSchema)
  })
  .strict()

const journalBaseSchema = z.object({
  version: z.literal(2),
  revision: z.number().int().nonnegative()
})

export const terminalTeardownIntentJournalRecordSchema = z.discriminatedUnion('kind', [
  journalBaseSchema
    .extend({
      kind: z.literal('checkpoint'),
      pendingLocalPtyShutdowns: z.array(localShutdownSchema),
      pendingRuntimeTerminalCloses: z.array(runtimeCloseSchema),
      pendingSshPtyShutdowns: z.array(sshShutdownSchema)
    })
    .strict(),
  journalBaseSchema
    .extend({ kind: z.literal('local-upsert'), request: localShutdownSchema })
    .strict(),
  journalBaseSchema.extend({ kind: z.literal('local-remove'), ptyId: nonEmptyString }).strict(),
  journalBaseSchema
    .extend({ kind: z.literal('runtime-upsert'), request: runtimeCloseSchema })
    .strict(),
  journalBaseSchema
    .extend({
      kind: z.literal('runtime-remove'),
      environmentId: nonEmptyString,
      handle: nonEmptyString
    })
    .strict(),
  journalBaseSchema
    .extend({ kind: z.literal('runtime-remove-environment'), environmentId: nonEmptyString })
    .strict(),
  journalBaseSchema
    .extend({
      kind: z.literal('ssh-set'),
      targetId: nonEmptyString,
      ptyId: nonEmptyString,
      relayInstanceId: nonEmptyString.optional(),
      shutdownRequestedAt: timestamp.optional()
    })
    .strict(),
  journalBaseSchema
    .extend({ kind: z.literal('ssh-remove-target'), targetId: nonEmptyString })
    .strict()
])

export type TerminalTeardownIntentSnapshot = z.infer<typeof terminalTeardownIntentSnapshotSchema>
export type TerminalTeardownIntentJournalRecord = z.infer<
  typeof terminalTeardownIntentJournalRecordSchema
>
export type TerminalTeardownIntentMutation =
  | { kind: 'local-upsert'; request: PersistedLocalPtyShutdown }
  | { kind: 'local-remove'; ptyId: string }
  | { kind: 'runtime-upsert'; request: PersistedRuntimeTerminalClose }
  | { kind: 'runtime-remove'; environmentId: string; handle: string }
  | { kind: 'runtime-remove-environment'; environmentId: string }
  | {
      kind: 'ssh-set'
      targetId: string
      ptyId: string
      relayInstanceId?: string
      shutdownRequestedAt?: number
    }
  | { kind: 'ssh-remove-target'; targetId: string }
