#!/usr/bin/env node

/**
 * Gmail OAuth2 Authentication Helper
 * 
 * Run this script to get your refresh token:
 *   npm run auth
 * 
 * Steps:
 * 1. Go to Google Cloud Console
 * 2. Create a new project or select existing
 * 3. Enable Gmail API
 * 4. Go to APIs & Services > Credentials
 * 5. Create OAuth 2.0 Client ID (Web application)
 * 6. Add https://developers.google.com/oauthplayground as authorized redirect URI
 * 7. Copy Client ID and Client Secret
 * 8. Run this script and follow the instructions
 */

import { google } from 'googleapis';
import * as readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly'
];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Gmail OAuth2 Setup Helper');
  console.log('='.repeat(60));
  console.log();
  console.log('Before running this script, make sure you have:');
  console.log('1. Created a Google Cloud project');
  console.log('2. Enabled the Gmail API');
  console.log('3. Created OAuth 2.0 credentials (Web application)');
  console.log('4. Added this redirect URI:');
  console.log('   https://developers.google.com/oauthplayground');
  console.log();

  const clientId = await question('Enter your Client ID: ');
  const clientSecret = await question('Enter your Client Secret: ');

  if (!clientId || !clientSecret) {
    console.error('Error: Client ID and Client Secret are required.');
    rl.close();
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent to get refresh token
  });

  console.log();
  console.log('='.repeat(60));
  console.log('Step 1: Authorize the application');
  console.log('='.repeat(60));
  console.log();
  console.log('Open this URL in your browser:');
  console.log();
  console.log(authUrl);
  console.log();
  console.log('After authorizing, you will be redirected to a page.');
  console.log('Copy the authorization code from the URL or page.');
  console.log();

  const code = await question('Enter the authorization code: ');

  if (!code) {
    console.error('Error: Authorization code is required.');
    rl.close();
    process.exit(1);
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log();
    console.log('='.repeat(60));
    console.log('Success! Here are your credentials:');
    console.log('='.repeat(60));
    console.log();
    console.log('Add these to your .env file:');
    console.log();
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log();
    console.log('The refresh token is permanent and will not expire');
    console.log('(unless you revoke access or change OAuth settings).');
    console.log();

    // Verify the credentials work
    console.log('Verifying credentials...');
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log();
    console.log(`✓ Successfully authenticated as: ${profile.data.emailAddress}`);
    console.log();
    console.log(`GMAIL_USER_EMAIL=${profile.data.emailAddress}`);
    console.log();

  } catch (error) {
    console.error();
    console.error('Error exchanging code for tokens:');
    console.error(error instanceof Error ? error.message : error);
    console.error();
    console.error('Make sure:');
    console.error('1. The authorization code is correct and has not expired');
    console.error('2. The redirect URI in your OAuth settings matches:');
    console.error('   https://developers.google.com/oauthplayground');
  }

  rl.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
