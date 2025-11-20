/**
 * Safe JSON.parse that prevents prototype pollution
 * SECURITY: Removes dangerous properties like __proto__, constructor, prototype
 *
 * @param jsonString JSON string to parse
 * @returns Parsed object with dangerous properties removed
 */
export function safeJsonParse<T = any>(jsonString: string): T {
  const parsed = JSON.parse(jsonString);

  // Recursively remove dangerous properties
  return removeDangerousProperties(parsed) as T;
}

/**
 * Recursively remove dangerous properties from object
 * Prevents prototype pollution attacks
 */
function removeDangerousProperties(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // List of dangerous property names
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];

  if (Array.isArray(obj)) {
    // Process array elements
    return obj.map((item) => removeDangerousProperties(item));
  }

  // Create clean object
  const cleaned: Record<string, any> = {};

  for (const key in obj) {
    // Skip dangerous properties
    if (dangerousProps.includes(key)) {
      console.warn(`[Security] Blocked dangerous property: ${key}`);
      continue;
    }

    // Only process own properties (not inherited)
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cleaned[key] = removeDangerousProperties(obj[key]);
    }
  }

  return cleaned;
}

/**
 * Validate that JSON doesn't contain circular references
 * @param obj Object to validate
 * @returns true if no circular references found
 */
export function hasCircularReference(obj: any, seen = new WeakSet()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (seen.has(obj)) {
    return true; // Circular reference detected
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.some((item) => hasCircularReference(item, seen));
  }

  return Object.values(obj).some((value) => hasCircularReference(value, seen));
}
