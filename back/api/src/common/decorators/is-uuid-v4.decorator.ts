import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * SECURITY: UUID v4 Validation Decorator
 *
 * Validates that a string is a valid UUID v4 format.
 * Prevents:
 * - SQL injection attempts via malformed IDs
 * - Database errors from invalid UUID formats
 * - Empty strings or null values
 * - Very long strings that could cause DoS
 *
 * Usage:
 * @IsUuidV4()
 * user_id!: string;
 */
export function IsUuidV4(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUuidV4',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // UUID v4 regex pattern
          // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
          // where x is any hex digit and y is one of 8, 9, A, or B
          const uuidV4Regex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

          return uuidV4Regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid UUID v4`;
        },
      },
    });
  };
}
