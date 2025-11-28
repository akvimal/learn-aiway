import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../utils/errors.util';
import { ResponseUtil } from '../../utils/response.util';
import { logger } from '../../config/logger.config';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    ResponseUtil.error(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
    return;
  }

  // Custom application errors
  if (error instanceof AppError) {
    ResponseUtil.error(res, error.message, error.statusCode, error.code, error.details);
    return;
  }

  // Unexpected errors
  ResponseUtil.error(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  ResponseUtil.error(
    res,
    `Route ${req.method} ${req.path} not found`,
    404,
    'NOT_FOUND'
  );
}
