/**
 * Gmail MCP Server for Railway/Render Deployment
 * 
 * This is a simple HTTP server that exposes MCP tools via SSE.
 * Deploy to Railway (free) for personal use!
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
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

// Load environment variables
const config = {
  clientId: process.env.GMAIL_CLIENT_ID || '',
  clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
  refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
  userEmail: process.env.GMAIL_USER_EMAIL || '',
  port: parseInt(process.env.PORT || '3000', 10),
};

// Rate limiting
let emailsSentThisHour = 0;
let emailsSentToday = 0;
const MAX_PER_HOUR = 20;
const MAX_PER_DAY = 50;

// Reset counters periodically
setInterval(() => { emailsSentThisHour = 0; }, 60 * 60 * 1000); // Reset hourly
setInterval(() => { emailsSentToday = 0; }, 24 * 60 * 60 * 1000); // Reset daily

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });
  return oauth2Client;
}

async function sendEmail(to: string, subject: string, body: string, cc?: string, bcc?: string) {
  if (emailsSentThisHour >= MAX_PER_HOUR) {
    return { success: false, error: 'Hourly rate limit reached' };
  }
  if (emailsSentToday >= MAX_PER_DAY) {
    return { success: false, error: 'Daily rate limit reached' };
  }

  try {
    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const headers = [
      `From: ${config.userEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
    ];
    if (cc) headers.push(`Cc: ${cc}`);
    if (bcc) headers.push(`Bcc: ${bcc}`);

    const email = headers.join('\r\n') + '\r\n\r\n' + body;
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail },
    });

    emailsSentThisHour++;
    emailsSentToday++;

    return { success: true, messageId: response.data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function verifyConnection() {
  try {
    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return { connected: true, email: profile.data.emailAddress };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

// MCP Tool definitions
const TOOLS = [
  {
    name: 'send_email',
    description: 'Send an email via Gmail. Just provide recipient, subject, and body.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body content' },
        cc: { type: 'string', description: 'CC recipients (optional)' },
        bcc: { type: 'string', description: 'BCC recipients (optional)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'verify_connection',
    description: 'Check if Gmail connection is working',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'check_status',
    description: 'Check email rate limit status',
    inputSchema: { type: 'object', properties: {} },
  },
];

// SSE connection management
const sseConnections = new Map<string, http.ServerResponse>();
let messageIdCounter = 0;

function sendSSE(res: http.ServerResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${config.port}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      server: 'gmail-mcp-server',
      email: config.userEmail ? config.userEmail.substring(0, 5) + '***' : 'not configured'
    }));
    return;
  }

  // SSE endpoint for MCP
  if (url.pathname === '/sse' && req.method === 'GET') {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    sseConnections.set(sessionId, res);
    
    // Send endpoint info
    sendSSE(res, 'endpoint', `/message?sessionId=${sessionId}`);

    req.on('close', () => {
      sseConnections.delete(sessionId);
      console.log('SSE connection closed:', sessionId);
    });

    console.log('SSE connection opened:', sessionId);
    return;
  }

  // Message endpoint for MCP JSON-RPC
  if (url.pathname === '/message' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const message = JSON.parse(body);
        const { id, method, params } = message;

        let result: any;

        if (method === 'initialize') {
          result = {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'gmail-mcp-server', version: '2.0.0' },
          };
        } else if (method === 'tools/list') {
          result = { tools: TOOLS };
        } else if (method === 'tools/call') {
          const { name, arguments: args } = params;
          
          if (name === 'send_email') {
            const emailResult = await sendEmail(args.to, args.subject, args.body, args.cc, args.bcc);
            result = {
              content: [{ type: 'text', text: JSON.stringify(emailResult, null, 2) }],
            };
          } else if (name === 'verify_connection') {
            const connResult = await verifyConnection();
            result = {
              content: [{ type: 'text', text: JSON.stringify(connResult, null, 2) }],
            };
          } else if (name === 'check_status') {
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  emailsSentThisHour,
                  emailsSentToday,
                  remainingThisHour: MAX_PER_HOUR - emailsSentThisHour,
                  remainingToday: MAX_PER_DAY - emailsSentToday,
                }, null, 2),
              }],
            };
          } else {
            result = { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
          }
        } else {
          result = {};
        }

        const response = { jsonrpc: '2.0', id, result };
        
        // Send response to SSE if session exists
        const sessionId = url.searchParams.get('sessionId');
        if (sessionId && sseConnections.has(sessionId)) {
          sendSSE(sseConnections.get(sessionId)!, 'message', response);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(config.port, () => {
  console.log(`\n🚀 Gmail MCP Server running on port ${config.port}`);
  console.log(`\n📧 Email: ${config.userEmail || 'NOT CONFIGURED'}`);
  console.log(`\n🔗 Endpoints:`);
  console.log(`   Health: http://localhost:${config.port}/`);
  console.log(`   SSE:    http://localhost:${config.port}/sse`);
  console.log(`\n✅ Ready for MCP connections!`);
});
