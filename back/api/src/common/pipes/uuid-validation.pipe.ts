import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

/**
 * UUID Validation Pipe
 * SECURITY: Validates that string parameters are valid UUIDs
 * Prevents injection attacks and invalid data
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('UUID parameter is required');
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('UUID must be a string');
    }

    // Check if it's a valid UUID
    if (!uuidValidate(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value.substring(0, 20)}`);
    }

    // Optionally check UUID version (v4 is most common)
    const version = uuidVersion(value);
    if (version !== 4) {
      // Allow other versions but log it
      console.warn(`[Security] Non-v4 UUID detected: ${value} (version ${version})`);
    }

    return value;
  }
}

/**
 * Optional UUID Validation Pipe (allows null/undefined)
 * Use for optional parameters
 */
@Injectable()
export class OptionalUuidValidationPipe implements PipeTransform<string | undefined, string | undefined> {
  transform(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('UUID must be a string');
    }

    if (!uuidValidate(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value.substring(0, 20)}`);
    }

    return value;
  }
}
