import { Router, Request, Response } from 'express';
import {
  getAuthUrl,
  handleAuthCallback,
  isGmailConfigured,
  isGmailAuthenticated
} from '../services/gmail.service';

const router = Router();

// Check Gmail authentication status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: isGmailConfigured(),
    authenticated: isGmailAuthenticated()
  });
});

// Initiate Google OAuth 2.0 flow
router.get('/google', (_req: Request, res: Response) => {
  if (!isGmailConfigured()) {
    res.status(400).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h2>⚠️ Gmail Credentials Missing</h2>
          <p>Please provide <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> in your <code>.env</code> file.</p>
          <a href="${env.CLIENT_URL}" style="color: #4f46e5;">Return to Dashboard</a>
        </body>
      </html>
    `);
    return;
  }

  const url = getAuthUrl();
  res.redirect(url);
});

// Handle OAuth 2.0 redirect callback
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    res.status(400).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">OAuth Authorization Failed</h2>
          <p>${error}</p>
          <a href="${env.CLIENT_URL}" style="color: #4f46e5;">Return to Dashboard</a>
        </body>
      </html>
    `);
    return;
  }

  if (!code) {
    res.status(400).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h2>No Authorization Code Provided</h2>
          <a href="${env.CLIENT_URL}" style="color: #4f46e5;">Return to Dashboard</a>
        </body>
      </html>
    `);
    return;
  }

  try {
    const { refreshToken } = await handleAuthCallback(code);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Account Connected</title>
          <meta http-equiv="refresh" content="3;url=${env.CLIENT_URL}" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 480px; }
            .icon { font-size: 48px; margin-bottom: 16px; }
            h2 { color: #10b981; margin: 0 0 12px 0; }
            p { color: #64748b; line-height: 1.5; margin-bottom: 24px; }
            .token-box { background: #f1f5f9; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; word-break: break-all; margin-bottom: 20px; color: #334155; }
            .btn { background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h2>Gmail Connected Successfully!</h2>
            <p>Your Team Lead email account has been authenticated. Redirecting you to the dashboard...</p>
            ${refreshToken ? `<p style="font-size: 12px; color: #94a3b8;">Add this to GMAIL_REFRESH_TOKEN in .env to preserve across server restarts:</p><div class="token-box">${refreshToken}</div>` : ''}
            <a href="${env.CLIENT_URL}" class="btn">Return to Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to exchange authorization code:', err);
    res.status(500).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Authorization Error</h2>
          <p>${message}</p>
          <a href="${env.CLIENT_URL}" style="color: #4f46e5;">Return to Dashboard</a>
        </body>
      </html>
    `);
  }
});

export default router;
