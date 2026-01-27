/**
 * Gmail Email Actor for Apify
 * 
 * This is a simple Apify Actor that sends emails via Gmail.
 * It's designed to work with Apify's MCP gateway so ChatGPT can use it.
 * 
 * Users provide their Gmail credentials in their Apify Actor settings,
 * then use Apify's MCP to send emails.
 */

import { Actor } from 'apify';
import { google } from 'googleapis';

interface ActorInput {
  // Action to perform
  action: 'send_email' | 'verify_connection' | 'check_status';
  
  // Email parameters (for send_email action)
  to?: string;
  subject?: string;
  body?: string;
  cc?: string;
  bcc?: string;
  
  // Gmail credentials (stored in Actor settings, passed automatically)
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
  gmailUserEmail?: string;
}

// Rate limiting
let emailsSentThisHour = 0;
let emailsSentToday = 0;
const MAX_PER_HOUR = 20;
const MAX_PER_DAY = 50;

function canSendEmail(): { allowed: boolean; reason?: string } {
  if (emailsSentThisHour >= MAX_PER_HOUR) {
    return { allowed: false, reason: `Hourly limit reached (${MAX_PER_HOUR}/hour)` };
  }
  if (emailsSentToday >= MAX_PER_DAY) {
    return { allowed: false, reason: `Daily limit reached (${MAX_PER_DAY}/day)` };
  }
  return { allowed: true };
}

async function sendEmail(
  oauth2Client: any,
  userEmail: string,
  to: string,
  subject: string,
  body: string,
  cc?: string,
  bcc?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Build email headers
    const headers = [
      `From: ${userEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
    ];
    
    if (cc) headers.push(`Cc: ${cc}`);
    if (bcc) headers.push(`Bcc: ${bcc}`);
    
    const email = headers.join('\r\n') + '\r\n\r\n' + body;
    
    // Encode to base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    
    emailsSentThisHour++;
    emailsSentToday++;
    
    return {
      success: true,
      messageId: response.data.id || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

async function verifyConnection(oauth2Client: any): Promise<{ connected: boolean; email?: string; error?: string }> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return {
      connected: true,
      email: profile.data.emailAddress || undefined,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Failed to connect to Gmail',
    };
  }
}

// Main Actor logic
Actor.main(async () => {
  const input = await Actor.getInput<ActorInput>();
  
  if (!input) {
    throw new Error('No input provided');
  }
  
  const { action, to, subject, body, cc, bcc, gmailClientId, gmailClientSecret, gmailRefreshToken, gmailUserEmail } = input;
  
  // Default action is send_email
  const actionToPerform = action || 'send_email';
  
  // Check credentials
  if (!gmailClientId || !gmailClientSecret || !gmailRefreshToken || !gmailUserEmail) {
    await Actor.pushData({
      success: false,
      error: 'Gmail credentials not configured. Please add your Gmail OAuth credentials in the Actor Input settings.',
      instructions: [
        '1. Go to Google Cloud Console and create OAuth credentials',
        '2. Use OAuth Playground to get a refresh token',
        '3. Add credentials to this Actor\'s Input tab',
      ],
    });
    return;
  }
  
  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    gmailClientId,
    gmailClientSecret,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: gmailRefreshToken });
  
  // Perform action
  if (actionToPerform === 'verify_connection') {
    const result = await verifyConnection(oauth2Client);
    await Actor.pushData(result);
    console.log('Connection verification result:', result);
    return;
  }
  
  if (actionToPerform === 'check_status') {
    await Actor.pushData({
      success: true,
      rateLimit: {
        emailsSentThisHour,
        emailsSentToday,
        remainingThisHour: MAX_PER_HOUR - emailsSentThisHour,
        remainingToday: MAX_PER_DAY - emailsSentToday,
      },
    });
    return;
  }
  
  if (actionToPerform === 'send_email') {
    // Validate email parameters
    if (!to) {
      await Actor.pushData({ success: false, error: 'Missing "to" field - recipient email address required' });
      return;
    }
    if (!subject) {
      await Actor.pushData({ success: false, error: 'Missing "subject" field - email subject required' });
      return;
    }
    if (!body) {
      await Actor.pushData({ success: false, error: 'Missing "body" field - email body required' });
      return;
    }
    
    // Check rate limit
    const rateCheck = canSendEmail();
    if (!rateCheck.allowed) {
      await Actor.pushData({ success: false, error: rateCheck.reason });
      return;
    }
    
    // Send email
    const result = await sendEmail(oauth2Client, gmailUserEmail, to, subject, body, cc, bcc);
    
    await Actor.pushData({
      ...result,
      recipient: to,
      subject: subject,
      sentAt: new Date().toISOString(),
    });
    
    console.log('Email send result:', result);
  }
});
