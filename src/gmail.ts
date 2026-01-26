import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getConfig } from './config.js';

let oauth2Client: OAuth2Client | null = null;

/**
 * Initialize and get the OAuth2 client for Gmail API
 */
export function getOAuth2Client(): OAuth2Client {
  if (oauth2Client) {
    return oauth2Client;
  }

  const config = getConfig();

  oauth2Client = new google.auth.OAuth2(
    config.gmail.clientId,
    config.gmail.clientSecret,
    'https://developers.google.com/oauthplayground' // Redirect URI for getting refresh token
  );

  oauth2Client.setCredentials({
    refresh_token: config.gmail.refreshToken
  });

  return oauth2Client;
}

/**
 * Get Gmail API client
 */
export function getGmailClient() {
  const auth = getOAuth2Client();
  return google.gmail({ version: 'v1', auth });
}

/**
 * Create a raw email in base64 format for Gmail API
 */
export function createRawEmail(options: {
  to: string;
  from: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}): string {
  const { to, from, subject, body, cc, bcc } = options;

  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
  ];

  if (cc && cc.length > 0) {
    messageParts.push(`Cc: ${cc.join(', ')}`);
  }

  if (bcc && bcc.length > 0) {
    messageParts.push(`Bcc: ${bcc.join(', ')}`);
  }

  messageParts.push(
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body
  );

  const message = messageParts.join('\r\n');

  // Encode to base64 URL-safe format
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedMessage;
}

/**
 * Send an email using Gmail API
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getConfig();
    const gmail = getGmailClient();

    const raw = createRawEmail({
      to: options.to,
      from: config.gmail.userEmail,
      subject: options.subject,
      body: options.body,
      cc: options.cc,
      bcc: options.bcc
    });

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw
      }
    });

    return {
      success: true,
      messageId: response.data.id ?? undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send email:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Verify Gmail API connection
 */
export async function verifyGmailConnection(): Promise<boolean> {
  try {
    const gmail = getGmailClient();
    await gmail.users.getProfile({ userId: 'me' });
    return true;
  } catch (error) {
    console.error('Gmail connection verification failed:', error);
    return false;
  }
}
