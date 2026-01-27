/**
 * Simple Gmail Test Script
 * Run: npx tsx src/test-gmail.ts
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  }
}

async function testGmail() {
  console.log('============================================');
  console.log('Gmail Connection Test');
  console.log('============================================\n');

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const userEmail = process.env.GMAIL_USER_EMAIL;

  console.log('Credentials loaded:');
  console.log('  Client ID:', clientId ? clientId.substring(0, 20) + '...' : 'MISSING');
  console.log('  Client Secret:', clientSecret ? clientSecret.substring(0, 10) + '...' : 'MISSING');
  console.log('  Refresh Token:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'MISSING');
  console.log('  User Email:', userEmail || 'MISSING');
  console.log('');

  if (!clientId || !clientSecret || !refreshToken || !userEmail) {
    console.error('❌ Missing credentials! Please check your .env file.');
    return;
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    console.log('Testing Gmail connection...\n');
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log('✅ Gmail Connected Successfully!');
    console.log('  Email:', profile.data.emailAddress);
    console.log('  Messages Total:', profile.data.messagesTotal);
    console.log('');
    
    // Ask if user wants to send test email
    console.log('Your Gmail connection is working!');
    console.log('You can now use the MCP server.');
    
  } catch (error: any) {
    console.error('❌ Gmail Connection Failed!');
    console.error('  Error:', error.message);
    console.error('');
    
    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized_client')) {
      console.log('🔧 FIX: You need a NEW refresh token!');
      console.log('');
      console.log('1. Go to: https://developers.google.com/oauthplayground');
      console.log('2. Click ⚙️ → Check "Use your own OAuth credentials"');
      console.log('3. Enter your Client ID and Client Secret from .env');
      console.log('4. Select Gmail API v1 scopes:');
      console.log('   - https://www.googleapis.com/auth/gmail.send');
      console.log('   - https://www.googleapis.com/auth/gmail.readonly');
      console.log('5. Click "Authorize APIs" → Sign in');
      console.log('6. Click "Exchange authorization code for tokens"');
      console.log('7. Copy the new Refresh Token to your .env file');
    }
  }
}

testGmail();
