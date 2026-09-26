import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`[HTTP] ${method} ${url} ${status} - ${duration}ms`);
  });

  next();
}
