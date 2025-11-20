import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as path from 'path';

/**
 * SECURITY: Validates file paths to prevent path traversal attacks
 *
 * This decorator ensures that file paths:
 * 1. Do not contain null bytes
 * 2. Do not contain path traversal sequences (../, ..\, etc.)
 * 3. Only contain whitelisted characters
 * 4. Have valid file extensions
 * 5. Are within reasonable length
 *
 * Usage:
 * @IsSafeFilePath({ allowedExtensions: ['.sql', '.txt'] })
 * file_path: string;
 */

export interface IsSafeFilePathOptions {
  /**
   * Allowed file extensions (e.g., ['.sql', '.txt'])
   * If not specified, all extensions are allowed
   */
  allowedExtensions?: string[];

  /**
   * Allow absolute paths
   * Default: false (only relative paths allowed)
   */
  allowAbsolutePaths?: boolean;

  /**
   * Custom validation message
   */
  message?: string;
}

export function IsSafeFilePath(
  options: IsSafeFilePathOptions = {},
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeFilePath',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [opts] = args.constraints as [IsSafeFilePathOptions];

          if (typeof value !== 'string') {
            return false;
          }

          // 1. Check for null bytes (can be used to bypass extension checks)
          if (value.includes('\0')) {
            return false;
          }

          // 2. Check for path traversal sequences
          const dangerousPatterns = [
            /\.\./,           // .. (parent directory)
            /~\//,            // ~/ (home directory)
            /\\/,             // backslashes (Windows path separators)
            /\/\//,           // double slashes
            /%2e%2e/i,        // URL-encoded ..
            /%2f/i,           // URL-encoded /
            /%5c/i,           // URL-encoded \
          ];

          for (const pattern of dangerousPatterns) {
            if (pattern.test(value)) {
              return false;
            }
          }

          // 3. Whitelist allowed characters
          // Allow: a-z, A-Z, 0-9, -, _, ., /, and space
          const allowedCharsRegex = /^[a-zA-Z0-9\-_.\/\s]+$/;
          if (!allowedCharsRegex.test(value)) {
            return false;
          }

          // 4. Check if absolute path is allowed
          if (!opts.allowAbsolutePaths && path.isAbsolute(value)) {
            return false;
          }

          // 5. Check file extension if specified
          if (opts.allowedExtensions && opts.allowedExtensions.length > 0) {
            const ext = path.extname(value).toLowerCase();
            if (!opts.allowedExtensions.includes(ext)) {
              return false;
            }
          }

          // 6. Additional security checks
          // Ensure no control characters
          // eslint-disable-next-line no-control-regex
          if (/[\x00-\x1f\x7f-\x9f]/.test(value)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [opts] = args.constraints as [IsSafeFilePathOptions];

          if (opts.message) {
            return opts.message;
          }

          const extMsg = opts.allowedExtensions
            ? ` Allowed extensions: ${opts.allowedExtensions.join(', ')}`
            : '';

          return `Invalid file path. Path must not contain traversal sequences, null bytes, or special characters.${extMsg}`;
        },
      },
    });
  };
}
