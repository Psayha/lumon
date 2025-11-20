import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { validateJsonb } from '../validators/jsonb-validator';

/**
 * SECURITY: Custom decorator for JSONB validation
 *
 * Validates JSONB fields to prevent:
 * - Prototype pollution
 * - DoS via huge objects
 * - Circular references
 * - Deep nesting attacks
 *
 * Usage:
 * @ValidateJsonb({ maxDepth: 5, maxSize: 50000 })
 * metadata?: Record<string, any>;
 */
export function ValidateJsonb(options?: {
  maxDepth?: number;
  maxSize?: number;
  allowedKeys?: string[];
  validationOptions?: ValidationOptions;
}) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'validateJsonb',
      target: object.constructor,
      propertyName: propertyName,
      options: options?.validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          try {
            // Allow null/undefined
            if (value === null || value === undefined) {
              return true;
            }

            // Validate JSONB
            validateJsonb(value, {
              maxDepth: options?.maxDepth,
              maxSize: options?.maxSize,
              allowedKeys: options?.allowedKeys,
            });

            return true;
          } catch (error: any) {
            // Store error message for defaultMessage
            (args.object as any)[`__${propertyName}_error`] = error.message;
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          // Get error message from validate()
          const errorMsg = (args.object as any)[`__${args.property}_error`];
          return errorMsg || `Invalid JSONB data in ${args.property}`;
        },
      },
    });
  };
}
