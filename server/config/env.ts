import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface EnvConfig {
  PORT: number;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REDIRECT_URI: string;
  GMAIL_REFRESH_TOKEN: string;
  TEAM_LEAD_EMAIL: string;
  CHECK_CRON: string;
  DB_PATH: string;
  EMPLOYEES_FILE: string;
  NODE_ENV: string;
  CLIENT_URL: string;
  TIMEZONE: string;
}

function resolveRedirectUri(): string {
  const uri = process.env.GMAIL_REDIRECT_URI || '';
  if (uri && !uri.includes('<') && !uri.includes('service-name') && !uri.includes('your-render')) {
    return uri;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/auth/callback`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://email-automation-backend-6ekc.onrender.com/auth/callback';
  }
  return 'http://localhost:3001/auth/callback';
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || '',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || '',
  GMAIL_REDIRECT_URI: resolveRedirectUri(),
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN || '',
  TEAM_LEAD_EMAIL: process.env.TEAM_LEAD_EMAIL || 'teamlead@example.com',
  CHECK_CRON: process.env.CHECK_CRON || '0 20 * * 1-5',
  DB_PATH: path.resolve(process.cwd(), 'data', 'email_automation.db'),
  EMPLOYEES_FILE: path.resolve(process.cwd(), 'data', 'employees.json'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata'
};

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!env.GMAIL_CLIENT_ID) missing.push('GMAIL_CLIENT_ID');
  if (!env.GMAIL_CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET');

  if (missing.length > 0) {
    console.warn(`[Env Warning] Missing Gmail credentials in .env: ${missing.join(', ')}`);
    console.warn('[Env Warning] Gmail search and send functionality will operate in simulation/demo mode until configured.');
    return { valid: false, missing };
  }

  return { valid: true, missing: [] };
}
