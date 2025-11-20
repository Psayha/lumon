import { timingSafeEqual } from 'crypto';

/**
 * Timing-safe string comparison
 * SECURITY: Prevents timing attacks by ensuring comparison time
 * is constant regardless of where strings differ
 *
 * @param a First string to compare
 * @param b Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  // Convert strings to buffers
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  // If lengths differ, pad the shorter one to prevent length-based timing attacks
  // We still need buffers of same length for timingSafeEqual
  const maxLength = Math.max(bufferA.length, bufferB.length);

  // Create fixed-length buffers
  const paddedA = Buffer.alloc(maxLength);
  const paddedB = Buffer.alloc(maxLength);

  bufferA.copy(paddedA);
  bufferB.copy(paddedB);

  try {
    // This will always take constant time regardless of where strings differ
    const buffersEqual = timingSafeEqual(paddedA, paddedB);

    // Also check original lengths to prevent length-based attacks
    const lengthsEqual = bufferA.length === bufferB.length;

    return buffersEqual && lengthsEqual;
  } catch (error) {
    // timingSafeEqual throws if buffers have different lengths
    // This should not happen due to padding, but handle it anyway
    return false;
  }
}
