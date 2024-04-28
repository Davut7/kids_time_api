import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomHttpExceptionResponse } from './httpExceptionResponse.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP-exception');

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status: HttpStatus;
    let errorMessage: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'object' && errorResponse['message']) {
        errorMessage = Array.isArray(errorResponse['message'])
          ? errorResponse['message'].join(', ')
          : errorResponse['message'];
      } else {
        errorMessage = `${exception.message}`;
      }
    } else {
      errorMessage =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const errorResponse = this.getErrorResponse(status, errorMessage, request);
    this.getErrorLog(errorResponse, request);

    response.status(status).json(errorResponse);
  }

  private getErrorResponse = (
    status: HttpStatus,
    errorMessage: string,
    request: Request,
  ): CustomHttpExceptionResponse => ({
    statusCode: status,
    message: errorMessage,
    path: request.url,
    method: request.method,
    timeStamp: new Date(),
  });

  private getErrorLog = (
    errorResponse: CustomHttpExceptionResponse,
    request: Request,
  ) => {
    const { statusCode, message } = errorResponse;
    const { method, originalUrl, hostname } = request;

    let host;
    if (request.headers['x-real-ip'] === hostname) {
      host = 'localhost';
    } else {
      host = request.headers['x-real-ip'] || '';
    }
    this.logger.error(message, [
      host,
      originalUrl,
      statusCode,
      method,
      JSON.stringify(request.user ?? 'Not signed in', null, 2),
    ]);
  };
}
