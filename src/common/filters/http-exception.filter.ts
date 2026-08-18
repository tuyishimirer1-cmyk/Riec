/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorData: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else {
        message = (res as any).message ?? exception.message;
        // Include validation errors and other details in data
        errorData = {
          error: (res as any).error || exception.name,
          details: (res as any).message || message,
          ...(Array.isArray((res as any).message) && {
            validationErrors: (res as any).message,
          }),
          ...((res as any).statusCode && { code: (res as any).statusCode }),
        };
      }
    } else {
      // Handle non-HTTP exceptions (like Prisma errors, etc.)
      const error = exception as any;

      if (error?.code === 'P2002') {
        // Prisma unique constraint violation
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        const target = error.meta?.target;
        const fieldName = Array.isArray(target)
          ? target.join(', ')
          : target || 'field';
        errorData = {
          error: 'Duplicate Entry',
          details: `A record with this ${fieldName} already exists`,
          field: Array.isArray(target) ? target[0] : target,
        };
      } else if (error?.code === 'P2025') {
        // Prisma record not found
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        errorData = {
          error: 'Not Found',
          details: 'The requested resource could not be found',
        };
      } else if (error?.code === 'P2023') {
        // Prisma invalid ID format
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID format';
        errorData = {
          error: 'Invalid Input',
          details: 'The provided ID is not in the correct format',
        };
      } else if (error?.code === 'P2014') {
        // Prisma relation violation (required relation not found, nesting too deep)
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Invalid related data';
        errorData = {
          error: 'Relation Violation',
          details:
            'The provided data references missing or invalid related records',
        };
      } else if (error?.code === 'P2024') {
        // Prisma timed out fetching from database
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database connection timed out';
        errorData = {
          error: 'Service Unavailable',
          details:
            'The database is currently overloaded. Please try again shortly.',
        };
      } else if (error?.name === 'ValidationError') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
        errorData = {
          error: 'Validation Error',
          details: error.message || 'One or more fields contain invalid data',
        };
      } else {
        // Generic error
        errorData = {
          error: 'Internal Server Error',
          details:
            process.env.NODE_ENV === 'development'
              ? error?.message || 'An unexpected error occurred'
              : 'An unexpected error occurred. Please try again later.',
        };
      }
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: errorData,
    });
  }
}
