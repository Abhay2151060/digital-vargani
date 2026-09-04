import * as crypto from 'crypto';

export const DEFAULT_PASSWORD = 'user123';
export const DEFAULT_PASSWORD_HASH =
  'a1b2c3d4e5f60718293a4b5c6d7e8f90:9c90fa9b1f9184ac23d9da426f479e347dc64936df6a1b9b2e17ab59647db2e4ca3b567252adb83761231a6332f821a6e4f608e844914b5bd935363758140bbf';

/**
 * Hashes a plaintext password using Node's crypto.scrypt with a 16-byte cryptographically secure salt.
 * Output format: `<salt_hex>:<derivedKey_hex>`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Constant-time password verification against stored scrypt hash.
 */
export function verifyPassword(password: string, combinedHash?: string | null): boolean {
  if (!combinedHash || typeof combinedHash !== 'string' || !combinedHash.includes(':')) {
    return false;
  }

  const [salt, key] = combinedHash.split(':');
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
