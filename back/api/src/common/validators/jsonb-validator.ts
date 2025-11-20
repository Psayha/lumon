import { BadRequestException } from '@nestjs/common';

/**
 * SECURITY: JSONB Validation and Sanitization
 *
 * JSONB fields can be exploited for:
 * - Prototype pollution attacks
 * - DoS via huge objects
 * - Циклические ссылки → crash
 * - Memory exhaustion
 *
 * This validator:
 * 1. Removes dangerous properties (__proto__, constructor, prototype)
 * 2. Limits object depth to prevent recursion attacks
 * 3. Limits total size to prevent DoS
 * 4. Detects and rejects circular references
 */

interface ValidationOptions {
  maxDepth?: number; // Maximum nesting depth (default: 10)
  maxSize?: number; // Maximum size in bytes (default: 100KB)
  allowedKeys?: string[]; // Whitelist of allowed top-level keys (optional)
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxDepth: 10,
  maxSize: 100 * 1024, // 100KB
  allowedKeys: [], // Empty = allow all
};

/**
 * Validate and sanitize JSONB object
 * Throws BadRequestException if validation fails
 */
export function validateJsonb(
  data: any,
  options: ValidationOptions = {},
): any {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    // Ensure allowedKeys is always an array
    allowedKeys: options.allowedKeys ?? DEFAULT_OPTIONS.allowedKeys,
  };

  // Check if null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Check size limit
  const jsonString = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

  if (sizeBytes > opts.maxSize) {
    throw new BadRequestException(
      `JSONB object too large: ${sizeBytes} bytes (max: ${opts.maxSize} bytes)`,
    );
  }

  // Detect circular references
  if (hasCircularReference(data)) {
    throw new BadRequestException(
      'JSONB object contains circular references',
    );
  }

  // Sanitize and validate depth
  const sanitized = sanitizeAndCheckDepth(data, 1, opts.maxDepth);

  // Validate allowed keys (if whitelist is specified)
  if (opts.allowedKeys && opts.allowedKeys.length > 0) {
    validateAllowedKeys(sanitized, opts.allowedKeys);
  }

  return sanitized;
}

/**
 * Detect circular references
 */
function hasCircularReference(obj: any): boolean {
  const seen = new WeakSet();

  function detect(current: any): boolean {
    if (current === null || typeof current !== 'object') {
      return false;
    }

    if (seen.has(current)) {
      return true; // Circular reference detected
    }

    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        if (detect(item)) {
          return true;
        }
      }
    } else {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          if (detect(current[key])) {
            return true;
          }
        }
      }
    }

    seen.delete(current);
    return false;
  }

  return detect(obj);
}

/**
 * Sanitize object and check depth
 */
function sanitizeAndCheckDepth(
  obj: any,
  currentDepth: number,
  maxDepth: number,
): any {
  if (currentDepth > maxDepth) {
    throw new BadRequestException(
      `JSONB object too deeply nested: depth ${currentDepth} (max: ${maxDepth})`,
    );
  }

  // Primitive types - return as is
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      sanitizeAndCheckDepth(item, currentDepth + 1, maxDepth),
    );
  }

  // Objects
  const sanitized: Record<string, any> = {};
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];

  for (const key in obj) {
    // Skip dangerous properties (prototype pollution prevention)
    if (dangerousProps.includes(key)) {
      console.warn(`[JSONB Security] Blocked dangerous property: ${key}`);
      continue;
    }

    // Skip properties not owned by this object
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeAndCheckDepth(
      obj[key],
      currentDepth + 1,
      maxDepth,
    );
  }

  return sanitized;
}

/**
 * Validate allowed keys (whitelist)
 */
function validateAllowedKeys(obj: any, allowedKeys: string[]): void {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return; // Only validate object keys
  }

  const objectKeys = Object.keys(obj);
  const invalidKeys = objectKeys.filter((key) => !allowedKeys.includes(key));

  if (invalidKeys.length > 0) {
    throw new BadRequestException(
      `Invalid JSONB keys: ${invalidKeys.join(', ')}. ` +
        `Allowed: ${allowedKeys.join(', ')}`,
    );
  }
}

/**
 * Convenience function for validating metadata fields
 */
export function validateMetadata(metadata: any): any {
  return validateJsonb(metadata, {
    maxDepth: 5, // Metadata shouldn't be deeply nested
    maxSize: 50 * 1024, // 50KB max for metadata
  });
}

/**
 * Convenience function for validating settings fields
 */
export function validateSettings(settings: any, allowedKeys?: string[]): any {
  return validateJsonb(settings, {
    maxDepth: 8,
    maxSize: 100 * 1024, // 100KB max for settings
    allowedKeys,
  });
}
