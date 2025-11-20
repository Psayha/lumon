import { createHash } from 'crypto';

/**
 * Hash a session token using SHA-256
 * SECURITY: Session tokens should never be stored in plain text
 * If database is compromised, plain tokens would allow session hijacking
 *
 * @param token The session token to hash
 * @returns SHA-256 hash of the token (hex string)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 * SECURITY: Constant-time comparison to prevent timing attacks
 *
 * @param token The plain token to verify
 * @param hashedToken The hashed token from database
 * @returns true if token matches hash
 */
export function verifyToken(token: string, hashedToken: string): boolean {
  const hash = hashToken(token);

  // Use timing-safe comparison
  if (hash.length !== hashedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ hashedToken.charCodeAt(i);
  }

  return result === 0;
}
