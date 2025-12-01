import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  logger.error('Error handled', {
    code,
    message,
    statusCode,
    details: err.details,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    code,
    message,
    details: err.details,
  });
};

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string) {
    super(message);
  }
}
