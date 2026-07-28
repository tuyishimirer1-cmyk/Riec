/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const handler = context.getHandler();

    // Get custom message from metadata if available
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      handler,
    );

    // Get route information
    const request = ctx.getRequest();
    const method = request.method;
    const routePath = this.getRoutePath(context);

    return next.handle().pipe(
      map((result) => {
        const statusCode = response.statusCode;
        const message =
          customMessage ||
          this.generateMessage(method, routePath, statusCode, result);

        // If the service returned a paginated shape { data, total, meta }
        if (result && typeof result === 'object' && 'data' in result) {
          const { data, total, meta, ...rest } = result;
          return {
            statusCode,
            message,
            data,
            ...(total !== undefined ? { total } : {}),
            ...(meta !== undefined ? { meta } : {}),
            ...rest,
          };
        }

        // Plain response
        return {
          statusCode,
          message,
          data: result,
        };
      }),
    );
  }

  private getRoutePath(context: ExecutionContext): string {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    // Get the route pattern from the handler metadata
    const handler = context.getHandler();
    // Try to get route path from route metadata
    const route = Reflect.getMetadata('path', handler) || '';
    return route;
  }

  private generateMessage(
    method: string,
    routePath: string,
    statusCode: number,
    result: any,
  ): string {
    // If result has a 'message' property, use it
    if (result && typeof result === 'object' && 'message' in result) {
      return result.message;
    }

    // Extract resource name from route path (e.g., "/projects" -> "project")
    const routeParts = routePath.split('/').filter(Boolean);
    const baseResource =
      routeParts.length > 0 && routeParts[0] !== 'identifier'
        ? routeParts[0].replace(/s$/, '') // Remove trailing 's' (projects -> project)
        : '';

    // Determine action from HTTP method and status
    switch (method) {
      case 'POST':
        if (statusCode === 201) {
          return `${this.capitalize(baseResource)} created successfully`;
        }
        break;
      case 'PUT':
        if (statusCode === 200) {
          return `${this.capitalize(baseResource)} updated successfully`;
        }
        break;
      case 'DELETE':
        if (statusCode === 200 || statusCode === 204) {
          return `${this.capitalize(baseResource)} deleted successfully`;
        }
        break;
      case 'GET':
        if (
          statusCode === 200 &&
          !routePath.includes('/') &&
          routeParts.length > 0
        ) {
          // Single resource GET like /projects/:id (but not nested like /projects/:id/images)
          const resourceType =
            routeParts[0] === 'identifier'
              ? this.capitalize(routeParts[1]?.replace(/s$/, '') || 'resource')
              : this.capitalize(baseResource);
          return `${resourceType} retrieved successfully`;
        }
        if (statusCode === 200) {
          // List endpoint
          return `${this.capitalize(baseResource)}s retrieved successfully`;
        }
        break;
    }

    // Fallback to status-based defaults
    switch (statusCode) {
      case 200:
        return 'Request successful';
      case 201:
        return 'Resource created successfully';
      case 204:
        return 'Resource deleted successfully';
      default:
        return 'Operation completed';
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
