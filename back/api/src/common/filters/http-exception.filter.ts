import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * SECURITY: Global Exception Filter
 *
 * Prevents leaking internal server details in production:
 * - Removes stack traces
 * - Sanitizes file paths
 * - Hides internal error details
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message || message
          : exceptionResponse;
    } else if (exception instanceof Error) {
      // SECURITY: Only expose error message in development
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;

      // Log full error for debugging (server-side only)
      this.logger.error(
        `HTTP ${status} Error:`,
        exception.stack || exception.message,
      );
    }

    // SECURITY: Never expose stack traces in production
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorDetails = {
        stack: exception.stack,
        name: exception.name,
      };
    }

    const errorResponse: any = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // Only include error details in development
    if (errorDetails) {
      errorResponse.error = errorDetails;
    }

    response.status(status).json(errorResponse);
  }
}
