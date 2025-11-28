import { Response } from 'express';
import { ApiResponse } from '../types';

export class ResponseUtil {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
