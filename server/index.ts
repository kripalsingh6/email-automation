import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, validateEnv } from './config/env';
import { runMigrations } from './db/migrations';
import { closeDatabase } from './db/connection';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import { startScheduler, stopScheduler } from './services/scheduler.service';

const app = express();

// Security Headers (configured to allow Vite frontend assets and Google fonts/scripts)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later.' }
});

const checkLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // max 30 manual checks per 5 mins
  message: { error: true, message: 'Check rate limit exceeded. Please wait a few minutes before triggering another check.' }
});

app.use('/api', apiLimiter);
app.use('/api/check', checkLimiter);

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'email-automation-server',
    teamLeadEmail: env.TEAM_LEAD_EMAIL,
    environment: env.NODE_ENV
  });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve compiled frontend in production
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Client-side SPA routing fallback
  app.get('{*path}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`📦 Serving production frontend bundle from: ${distPath}`);
}

// Global Error Handler
app.use(errorHandler);

// Validate environment on boot
const envValidation = validateEnv();

// Run database migrations
try {
  runMigrations();
} catch (error) {
  console.error('❌ Failed to run database migrations:', error);
}

// Start cron scheduler
try {
  startScheduler();
} catch (error) {
  console.error('❌ Failed to initialize scheduler:', error);
}

// Start HTTP server
const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Production Email Automation Server running on port ${env.PORT}`);
  console.log(`📡 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`📊 API status:   http://localhost:${env.PORT}/api/status`);
  console.log(`🔑 Auth status:  http://localhost:${env.PORT}/auth/status`);
  console.log(`📧 Team Lead:    ${env.TEAM_LEAD_EMAIL}`);
  console.log(`⚙️  Environment:  ${env.NODE_ENV}`);
  if (!envValidation.valid) {
    console.log(`⚠️  Missing credentials: ${envValidation.missing.join(', ')}`);
  }
  console.log(`===============================================`);
});

// Handle graceful shutdown
function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  stopScheduler();
  closeDatabase();
  server.close(() => {
    console.log('Server, scheduler, and database stopped.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
