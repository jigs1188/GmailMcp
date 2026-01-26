#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { sendEmail, verifyGmailConnection } from './gmail.js';
import {
  canSendEmail,
  recordEmailSent,
  getRateLimitStatus,
  getRandomDelay,
  sleep
} from './rateLimiter.js';
import { validateConfig } from './config.js';

// Create MCP server
const server = new McpServer({
  name: 'gmail-mcp-server',
  version: '2.0.0'
});

// ============================================================================
// TOOL 1: send_email
// Send a single email immediately
// ============================================================================

server.tool(
  'send_email',
  'Send an email via Gmail. Use this for any email - personal, professional, follow-ups, newsletters, etc. Rate-limited to protect your account.',
  {
    to: z.string().describe('Recipient email address (single or comma-separated for multiple)'),
    subject: z.string().max(200).describe('Email subject line'),
    body: z.string().max(10000).describe('Email body content (plain text)'),
    cc: z.string().optional().describe('Optional: CC recipients (comma-separated)'),
    bcc: z.string().optional().describe('Optional: BCC recipients (comma-separated)')
  },
  async ({ to, subject, body, cc, bcc }) => {
    try {
      // Check rate limits
      const rateStatus = canSendEmail();
      if (!rateStatus.allowed) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: rateStatus.reason,
                rate_limit: getRateLimitStatus()
              }, null, 2)
            }
          ]
        };
      }

      // Parse multiple recipients
      const toAddresses = to.split(',').map(e => e.trim()).filter(Boolean);
      const ccAddresses = cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : [];
      const bccAddresses = bcc ? bcc.split(',').map(e => e.trim()).filter(Boolean) : [];

      // Send to primary recipient(s)
      const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];

      for (const recipient of toAddresses) {
        const result = await sendEmail({
          to: recipient,
          subject,
          body,
          cc: ccAddresses,
          bcc: bccAddresses
        });

        if (result.success) {
          recordEmailSent();
        }

        results.push({
          email: recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        // Add delay between sends if multiple recipients
        if (toAddresses.length > 1) {
          await sleep(getRandomDelay());
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: successCount > 0,
              message: `Sent ${successCount}/${results.length} emails successfully`,
              results,
              rate_limit: getRateLimitStatus()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }
);

// ============================================================================
// TOOL 2: compose_and_send
// Let ChatGPT compose and send in one step
// ============================================================================

server.tool(
  'compose_and_send',
  'Compose and send an email based on your instructions. Describe what you want to say and I will draft and send it.',
  {
    to: z.string().describe('Recipient email address'),
    purpose: z.string().describe('What is this email about? Describe the purpose and key points.'),
    tone: z.enum(['professional', 'friendly', 'casual', 'formal', 'apologetic', 'urgent']).default('professional').describe('Desired tone of the email'),
    subject_hint: z.string().optional().describe('Optional: Suggested subject or leave blank for auto-generation'),
    include_points: z.array(z.string()).optional().describe('Optional: Specific points or information to include'),
    max_length: z.enum(['short', 'medium', 'long']).default('medium').describe('Email length: short (2-3 sentences), medium (1-2 paragraphs), long (3+ paragraphs)')
  },
  async ({ to, purpose, tone, subject_hint, include_points, max_length }) => {
    try {
      // Check rate limits
      const rateStatus = canSendEmail();
      if (!rateStatus.allowed) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: rateStatus.reason,
                rate_limit: getRateLimitStatus()
              }, null, 2)
            }
          ]
        };
      }

      // Return composition instructions for ChatGPT to generate the content
      // ChatGPT will use this to create the email and then call send_email
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              action_required: 'generate_and_send',
              instructions: `Please generate an email with these specifications and then use the send_email tool to send it:

RECIPIENT: ${to}
PURPOSE: ${purpose}
TONE: ${tone}
LENGTH: ${max_length}
${subject_hint ? `SUBJECT HINT: ${subject_hint}` : 'SUBJECT: Generate an appropriate subject line'}
${include_points?.length ? `MUST INCLUDE:\n${include_points.map(p => `- ${p}`).join('\n')}` : ''}

After generating the email, call send_email with the to, subject, and body.`,
              rate_limit: getRateLimitStatus()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }
);

// ============================================================================
// TOOL 3: send_bulk_emails
// Send the same email to multiple recipients
// ============================================================================

server.tool(
  'send_bulk_emails',
  'Send the same email to multiple recipients. Each recipient gets an individual email (not CC/BCC). Rate-limited with delays between sends.',
  {
    recipients: z.array(z.string().email()).describe('List of recipient email addresses'),
    subject: z.string().max(200).describe('Email subject line'),
    body: z.string().max(10000).describe('Email body content'),
    personalize_greeting: z.boolean().default(false).describe('If true, expects {name} placeholder in body to personalize'),
    recipient_names: z.array(z.string()).optional().describe('Names corresponding to each recipient (for personalization)')
  },
  async ({ recipients, subject, body, personalize_greeting, recipient_names }) => {
    try {
      // Check rate limits
      const rateStatus = canSendEmail();
      if (!rateStatus.allowed) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: rateStatus.reason,
                rate_limit: getRateLimitStatus()
              }, null, 2)
            }
          ]
        };
      }

      const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
      const maxToSend = Math.min(recipients.length, getRateLimitStatus().hourlyRemaining, getRateLimitStatus().dailyRemaining);

      if (maxToSend < recipients.length) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Can only send ${maxToSend} emails due to rate limits. Requested: ${recipients.length}`,
                rate_limit: getRateLimitStatus()
              }, null, 2)
            }
          ]
        };
      }

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        let emailBody = body;

        // Personalize if requested
        if (personalize_greeting && recipient_names && recipient_names[i]) {
          emailBody = body.replace(/{name}/g, recipient_names[i]);
        }

        const result = await sendEmail({
          to: recipient,
          subject,
          body: emailBody
        });

        if (result.success) {
          recordEmailSent();
        }

        results.push({
          email: recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        // Add delay between sends
        if (i < recipients.length - 1) {
          await sleep(getRandomDelay());
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: successCount > 0,
              message: `Sent ${successCount}/${results.length} emails successfully`,
              results,
              rate_limit: getRateLimitStatus()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }
);

// ============================================================================
// TOOL 4: check_email_status
// Check rate limits and sending capacity
// ============================================================================

server.tool(
  'check_email_status',
  'Check your current email sending capacity and rate limit status.',
  {},
  async () => {
    const status = getRateLimitStatus();
    const canSend = canSendEmail();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            can_send: canSend.allowed,
            reason: canSend.reason,
            hourly: {
              sent: status.hourlyCount,
              limit: status.hourlyLimit,
              remaining: status.hourlyRemaining
            },
            daily: {
              sent: status.dailyCount,
              limit: status.dailyLimit,
              remaining: status.dailyRemaining
            },
            tip: canSend.allowed 
              ? `You can send up to ${Math.min(status.hourlyRemaining, status.dailyRemaining)} more emails right now.`
              : 'Wait for the rate limit to reset before sending more emails.'
          }, null, 2)
        }
      ]
    };
  }
);

// ============================================================================
// TOOL 5: verify_connection
// Verify Gmail API is working
// ============================================================================

server.tool(
  'verify_connection',
  'Verify that the Gmail connection is working. Use this to test if your email is properly configured.',
  {},
  async () => {
    try {
      const isConnected = await verifyGmailConnection();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: isConnected,
              message: isConnected
                ? '✓ Gmail is connected and ready to send emails!'
                : '✗ Gmail connection failed. Check your credentials in the .env file.'
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }
);

// ============================================================================
// TOOL 6: schedule_reminder
// Create a reminder to send an email later (returns info for user to act on)
// ============================================================================

server.tool(
  'schedule_reminder',
  'Create a reminder for an email you want to send later. Returns the email details for you to send when ready.',
  {
    to: z.string().describe('Recipient email address'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body'),
    reminder_note: z.string().optional().describe('Note about when/why to send this email')
  },
  async ({ to, subject, body, reminder_note }) => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Email saved for later. Ask me to send it when you\'re ready.',
            reminder: {
              to,
              subject,
              body,
              note: reminder_note || 'No reminder note set',
              created_at: new Date().toISOString()
            },
            how_to_send: 'Say "send that email" or "send the email to [recipient]" when ready.'
          }, null, 2)
        }
      ]
    };
  }
);

// ============================================================================
// Start the server
// ============================================================================

async function main() {
  // Check if running on Apify
  const isApify = !!process.env.APIFY_TOKEN || !!process.env.APIFY_ACTOR_ID;
  
  if (isApify) {
    console.log('Running on Apify platform...');
    
    // Dynamic import Apify SDK only when on Apify
    const { Actor } = await import('apify');
    await Actor.init();
    
    // Get input from Apify
    const input = await Actor.getInput() as Record<string, unknown> | null;
    
    if (input) {
      // Set environment variables from Actor input
      if (input.gmailClientId) process.env.GMAIL_CLIENT_ID = String(input.gmailClientId);
      if (input.gmailClientSecret) process.env.GMAIL_CLIENT_SECRET = String(input.gmailClientSecret);
      if (input.gmailRefreshToken) process.env.GMAIL_REFRESH_TOKEN = String(input.gmailRefreshToken);
      if (input.gmailUserEmail) process.env.GMAIL_USER_EMAIL = String(input.gmailUserEmail);
      if (input.maxEmailsPerHour) process.env.MAX_EMAILS_PER_HOUR = String(input.maxEmailsPerHour);
      if (input.maxEmailsPerDay) process.env.MAX_EMAILS_PER_DAY = String(input.maxEmailsPerDay);
    }
    
    console.log('Apify Actor initialized, starting MCP server...');
  }

  console.error('Gmail MCP Server v2.0 starting...');

  const configValid = validateConfig();
  if (!configValid) {
    console.error('WARNING: Configuration is invalid. Gmail features will not work.');
    console.error('Please provide Gmail credentials via Actor input or .env file.');
  }

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error('Gmail MCP Server is running!');
  
  // Keep alive for Apify standby mode
  if (isApify) {
    console.log('MCP Server ready for connections via Apify Standby mode');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
