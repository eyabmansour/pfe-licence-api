import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      response.status(status).json({
        message: exception.getResponse()['message'],
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      this.logger.error(exception);
      response.status(500).json({
        message: 'Internal server error',
        statusCode: '5OO',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
