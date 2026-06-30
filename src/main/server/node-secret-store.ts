import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  type CipherGCM,
  type DecipherGCM
} from 'node:crypto'
import { hostname, userInfo } from 'node:os'
import { writeSecureFile, hardenExistingSecureFile } from '../../shared/secure-file'
import type { SecretStore } from '../../shared/secret-store'

/**
 * Node SecretStore for the headless server. Encrypts at rest with AES-256-GCM
 * under a key persisted (0o600) in userData, so secrets are NOT plaintext on
 * keychain-less Linux containers — the regression that a naive
 * isEncryptionAvailable()=false fallback would cause.
 *
 * The key is generated once and stored locally; this protects against casual
 * disk inspection / backup leakage, not against an attacker who already has
 * read access to userData (they could read the key too). That matches the
 * threat model of safeStorage on Linux, which also falls back to a local key.
 *
 * Ciphertext layout: MAGIC(4) | iv(12) | authTag(16) | data. The MAGIC prefix
 * makes our blobs distinguishable from legacy plaintext and from Electron
 * safeStorage blobs, so callers' existing plaintext-legacy detection still works.
 */
const MAGIC = Buffer.from('ORC1', 'ascii')
const IV_LEN = 12
const TAG_LEN = 16
const KEY_FILE = 'node-secret-store.key'

export type NodeSecretStoreOptions = {
  userDataPath: string
  /**
   * When true (default), encryption is available and a key is created on first
   * use. Set false to force the plaintext-fallback contract (e.g. for parity
   * tests) — callers then store plaintext exactly as on a keychain-less host.
   */
  encryptionAvailable?: boolean
}

export class NodeSecretStore implements SecretStore {
  private readonly keyPath: string
  private readonly available: boolean
  private key: Buffer | null = null

  constructor(options: NodeSecretStoreOptions) {
    this.keyPath = join(options.userDataPath, KEY_FILE)
    this.available = options.encryptionAvailable ?? true
  }

  isEncryptionAvailable(): boolean {
    return this.available
  }

  encryptString(plainText: string): Buffer {
    if (!this.available) {
      throw new Error('NodeSecretStore: encryption not available')
    }
    const key = this.ensureKey()
    const iv = randomBytes(IV_LEN)
    const cipher = createCipheriv('aes-256-gcm', key, iv) as CipherGCM
    const data = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([MAGIC, iv, tag, data])
  }

  decryptString(cipherBuf: Buffer): string {
    if (!this.available) {
      throw new Error('NodeSecretStore: encryption not available')
    }
    if (!cipherBuf.subarray(0, MAGIC.length).equals(MAGIC)) {
      // Not our format — let the caller fall back to plaintext-legacy handling
      // exactly as it does for unknown blobs today.
      throw new Error('NodeSecretStore: unrecognized ciphertext')
    }
    const key = this.ensureKey()
    const iv = cipherBuf.subarray(MAGIC.length, MAGIC.length + IV_LEN)
    const tag = cipherBuf.subarray(MAGIC.length + IV_LEN, MAGIC.length + IV_LEN + TAG_LEN)
    const data = cipherBuf.subarray(MAGIC.length + IV_LEN + TAG_LEN)
    const decipher = createDecipheriv('aes-256-gcm', key, iv) as DecipherGCM
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  }

  private ensureKey(): Buffer {
    if (this.key) {
      return this.key
    }
    if (existsSync(this.keyPath)) {
      try {
        const stored = Buffer.from(readFileSync(this.keyPath, 'utf8').trim(), 'base64')
        if (stored.length === 32) {
          hardenExistingSecureFile(this.keyPath)
          this.key = stored
          return stored
        }
      } catch {
        // Fall through and regenerate; a corrupt key file is unrecoverable for
        // existing ciphertext anyway, so a fresh key is the best we can do.
      }
    }
    // Why: mix in host/user identity so a key file copied to a different machine
    // is at least bound to its origin, mirroring safeStorage's local-key model.
    const seed = createHash('sha256')
      .update(randomBytes(32))
      .update(`${hostname()}:${safeUsername()}`)
      .digest()
    const key = Buffer.from(seed)
    writeSecureFile(this.keyPath, key.toString('base64'))
    this.key = key
    return key
  }
}

function safeUsername(): string {
  try {
    return userInfo().username
  } catch {
    return 'unknown'
  }
}
