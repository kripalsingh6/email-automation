import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

export interface EmailMessage {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  date: string;
  snippet?: string;
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
];

const TOKEN_FILE = path.resolve(process.cwd(), 'data', 'tokens.json');

let oauth2Client: OAuth2Client | null = null;
let currentRefreshToken: string = env.GMAIL_REFRESH_TOKEN;

function loadStoredCredentials(client: OAuth2Client) {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const saved = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      if (saved.refresh_token) {
        currentRefreshToken = saved.refresh_token;
      }
      client.setCredentials(saved);
      console.log('🔑 Stored Gmail OAuth credentials loaded from data/tokens.json.');
      return;
    }
  } catch (err) {
    console.error('Error loading data/tokens.json:', err);
  }

  if (currentRefreshToken) {
    client.setCredentials({ refresh_token: currentRefreshToken });
  }
}

export function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      env.GMAIL_CLIENT_ID,
      env.GMAIL_CLIENT_SECRET,
      env.GMAIL_REDIRECT_URI
    );

    loadStoredCredentials(oauth2Client);

    // Auto-save refreshed tokens when Google rotates access tokens
    oauth2Client.on('tokens', (tokens) => {
      try {
        let existing = {};
        if (fs.existsSync(TOKEN_FILE)) {
          existing = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
        }
        const updated = { ...existing, ...tokens };
        if (tokens.refresh_token) {
          currentRefreshToken = tokens.refresh_token;
        }
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(updated, null, 2), 'utf-8');
        console.log('🔄 OAuth credentials refreshed and saved to data/tokens.json.');
      } catch (err) {
        console.error('Error saving updated tokens:', err);
      }
    });
  }

  return oauth2Client;
}

export function isGmailConfigured(): boolean {
  return Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET);
}

export function isGmailAuthenticated(): boolean {
  const client = getOAuth2Client();
  return Boolean(
    currentRefreshToken ||
    client.credentials.access_token ||
    client.credentials.refresh_token
  );
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Forces consent to ensure a refresh_token is always returned
  });
}

export async function handleAuthCallback(code: string): Promise<{ refreshToken: string }> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);
  if (tokens.refresh_token) {
    currentRefreshToken = tokens.refresh_token;
  }

  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
    console.log('💾 Tokens saved successfully to data/tokens.json.');

    // Also persist refresh_token in .env for durability
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath) && tokens.refresh_token) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /GMAIL_REFRESH_TOKEN=.*/,
          `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`
        );
      } else {
        envContent += `\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }
  } catch (saveErr) {
    console.warn('Could not auto-save tokens:', saveErr);
  }

  console.log('✅ Google OAuth2 credentials received and active.');
  return { refreshToken: currentRefreshToken || '' };
}

export async function searchEmails(query: string): Promise<EmailMessage[]> {
  if (!isGmailConfigured() || !isGmailAuthenticated()) {
    console.log(`[Gmail Simulation] Searching inbox with query: "${query}"`);
    return [];
  }

  try {
    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return [];
    }

    const emailDetails: EmailMessage[] = [];

    // Fetch metadata for each message
    for (const msg of messages) {
      if (!msg.id) continue;

      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
      const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

      emailDetails.push({
        id: msg.id,
        threadId: msg.threadId || undefined,
        subject,
        from,
        date,
        snippet: detail.data.snippet || undefined
      });
    }

    return emailDetails;
  } catch (error) {
    console.error('[Gmail Service] Error searching emails:', error);
    throw error;
  }
}

export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<{ messageId?: string; simulated?: boolean }> {
  if (!isGmailConfigured() || !isGmailAuthenticated()) {
    console.log(`[Gmail Simulation] Sent email to: "${to}" | Subject: "${subject}"`);
    return { simulated: true };
  }

  try {
    const auth = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    // Format RFC 2822 email
    const sender = env.TEAM_LEAD_EMAIL || 'me';
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${sender}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody
    ];

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`✅ [Gmail Service] Email sent successfully to ${to}. Message ID: ${res.data.id}`);
    return { messageId: res.data.id || undefined, simulated: false };
  } catch (error) {
    console.error(`[Gmail Service] Error sending email to ${to}:`, error);
    throw error;
  }
}
