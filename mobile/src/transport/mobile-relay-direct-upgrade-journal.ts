import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { sha256 } from '@noble/hashes/sha256'
import { z } from 'zod'

const Base64Url32ByteSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

export const MobileRelayDirectUpgradeJournalSchema = z
  .object({
    v: z.literal(1),
    hostId: z.string().min(1),
    reqId: z.string().min(1).max(128),
    pendingResumeToken: Base64Url32ByteSchema,
    pendingResumeTokenHash: Base64Url32ByteSchema
  })
  .strict()

export type MobileRelayDirectUpgradeJournal = z.infer<typeof MobileRelayDirectUpgradeJournalSchema>

const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
}

function journalKey(hostId: string): string {
  return `orca.mobile-relay.direct-upgrade.${hostId}`
}

export function createMobileRelayDirectUpgradeJournal(
  hostId: string,
  randomBytes: (length: number) => Uint8Array
): MobileRelayDirectUpgradeJournal {
  const pendingResumeToken = encodeBase64Url(randomBytes(32))
  return MobileRelayDirectUpgradeJournalSchema.parse({
    v: 1,
    hostId,
    reqId: `upgrade-${encodeBase64Url(randomBytes(16))}`,
    pendingResumeToken,
    pendingResumeTokenHash: encodeBase64Url(sha256(decodeBase64Url(pendingResumeToken)))
  })
}

export async function readMobileRelayDirectUpgradeJournal(
  hostId: string
): Promise<MobileRelayDirectUpgradeJournal | null> {
  requireNativeSecretStore()
  const raw = await SecureStore.getItemAsync(journalKey(hostId), KEYCHAIN_OPTIONS)
  if (!raw) {
    return null
  }
  try {
    const parsed = MobileRelayDirectUpgradeJournalSchema.safeParse(JSON.parse(raw))
    return parsed.success && parsed.data.hostId === hostId ? parsed.data : null
  } catch {
    return null
  }
}

export async function writeMobileRelayDirectUpgradeJournal(
  journal: MobileRelayDirectUpgradeJournal
): Promise<void> {
  requireNativeSecretStore()
  const parsed = MobileRelayDirectUpgradeJournalSchema.parse(journal)
  await SecureStore.setItemAsync(
    journalKey(parsed.hostId),
    JSON.stringify(parsed),
    KEYCHAIN_OPTIONS
  )
}

export async function deleteMobileRelayDirectUpgradeJournal(hostId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return
  }
  await SecureStore.deleteItemAsync(journalKey(hostId), KEYCHAIN_OPTIONS)
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = ''
  for (const byte of value) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function requireNativeSecretStore(): void {
  if (Platform.OS === 'web') {
    throw new Error('Orca Relay upgrade state requires a native secret store')
  }
}
