import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('💥 [Server Error]:', err.stack || err.message);

  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
}
