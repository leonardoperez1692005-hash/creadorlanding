// =============================================
// Token Manager — AES-256-GCM encryption for OAuth tokens
// =============================================

import crypto from 'crypto'
import { logger } from '@/shared/lib/logger'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
    const keyHex = process.env.TOKEN_ENCRYPTION_KEY
    if (!keyHex || keyHex.length !== 64) {
        throw new Error(
            "TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        )
    }
    return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypt a plaintext token for storage in DB.
 * Format: base64(iv + authTag + ciphertext)
 */
export function encryptToken(plaintext: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Pack: iv(16) + authTag(16) + ciphertext(variable)
    const packed = Buffer.concat([iv, authTag, encrypted])
    return packed.toString('base64')
}

/**
 * Decrypt a token from DB storage.
 */
export function decryptToken(encryptedBase64: string): string {
    const key = getEncryptionKey()
    const packed = Buffer.from(encryptedBase64, 'base64')

    if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
        throw new Error('Invalid encrypted token: too short')
    }

    const iv = packed.subarray(0, IV_LENGTH)
    const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
}

/**
 * Check if a token is expired or about to expire (within 5 minutes).
 */
export function isTokenExpired(expiresAt: Date | string | null): boolean {
    if (!expiresAt) return false // No expiry = assume valid
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    return expiry <= fiveMinutesFromNow
}

/**
 * Rotate tokens: encrypt new tokens and return encrypted values.
 */
export function encryptTokenPair(
    accessToken: string,
    refreshToken?: string,
): {
    accessTokenEncrypted: string
    refreshTokenEncrypted: string | null
} {
    logger.info('token-manager', 'Encrypting token pair')
    return {
        accessTokenEncrypted: encryptToken(accessToken),
        refreshTokenEncrypted: refreshToken ? encryptToken(refreshToken) : null,
    }
}
