# Deploy and Host Gmail MCP Server on Railway

The Gmail MCP Server is a high-performance utility that allows AI models like ChatGPT and Claude to securely execute tasks inside your inbox. It implements the Model Context Protocol to enable natural language email drafting, searching, and bulk sends, effectively turning your AI assistant into a fully integrated personal secretary.

## About Hosting Gmail MCP Sever

Deploying the Gmail MCP Server on Railway transforms your automation tool from a local script into a permanent cloud-based service. By utilizing the Server-Sent Events (SSE) transport protocol, your server remains continuously available to external AI platforms without requiring your local machine to stay powered on. The setup process involves configuring your Google Cloud OAuth 2.0 credentials within Railway's environment settings. Once deployed, Railway manages the server lifecycle, handles SSL encryption, and provides a stable URL that you can plug into ChatGPT Plus or the Claude Desktop App for immediate, 24/7 email automation.

## Common Use Cases

- **AI Executive Presence:** Ask ChatGPT to "Review my unread emails from the last 4 hours and draft brief summaries with priority levels."
- **Seamless Follow-ups:** Tell Claude to "Find the email chain regarding the marketing project and send a polite follow-up to everyone asking for their status updates."
- **Inbox Mastery:** Search through thousands of emails using conversational queries like "What was the name of the hotel I booked for my trip to London last year?"

## Dependencies for Gmail MCP Sever Hosting

- **Google Cloud Platform Project:** Required to enable the Gmail API and generate the OAuth 2.0 Client ID and Client Secret secure keys.
- **Persistent OAuth Refresh Token:** Necessary for the server to maintain a long-term, authorized connection to your Gmail account without manual re-authentication.

### Deployment Dependencies

- [Link to Google OAuth Playground](https://developers.google.com/oauthplayground) (Generate your Gmail Refresh Token here)
- [Model Context Protocol (MCP) Official Site](https://modelcontextprotocol.io/)
- [OpenAI Developer MCP Documentation](https://platform.openai.com/docs/mcp)

### Implementation Details

This server is built using the `@modelcontextprotocol/sdk` and `googleapis` libraries. It uses a `SSEServerTransport` to maintain a reliable connection with AI clients, allowing for real-time tool execution over standard HTTP.

## Why Deploy Gmail MCP Sever on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Gmail MCP Sever on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
|---------|-------------|
| 📨 **Send Emails** | Send any email through natural conversation |
| ✍️ **AI Composes** | Describe what you want, AI writes the email |
| 👥 **Bulk Send** | Send to multiple recipients with personalization |
| 📋 **CC/BCC** | Full support for CC and BCC recipients |
| 🛡️ **Rate Limited** | Protects your Gmail from being flagged (20/hour, 50/day) |
| 🔒 **Secure** | Your credentials stay encrypted on Apify |

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Gmail API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Search for **"Gmail API"** and **Enable** it
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth 2.0 Client ID**
6. Choose **Web application**
7. Add this redirect URI: `https://developers.google.com/oauthplayground`
8. Copy your **Client ID** and **Client Secret**

### Step 2: Get Refresh Token

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
2. Click ⚙️ (Settings) → Check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In the left panel, find **Gmail API v1** and select:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
5. Click **Authorize APIs** → Sign in with your Gmail
6. Click **Exchange authorization code for tokens**
7. Copy the **Refresh Token**

### Step 3: Configure This Actor

Enter your credentials in the input fields:
- **Gmail Client ID**: Your OAuth Client ID
- **Gmail Client Secret**: Your OAuth Client Secret  
- **Gmail Refresh Token**: The token from Step 2
- **Gmail Email Address**: Your Gmail address

### Step 4: Connect to Your AI Assistant

#### For ChatGPT:
1. Go to Settings → Beta features → Enable MCP
2. Add MCP Server URL: `https://mcp.apify.com/?actors=YOUR_USERNAME/gmail-mcp-server`

#### For Claude Desktop:
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "gmail": {
      "url": "https://mcp.apify.com/?actors=YOUR_USERNAME/gmail-mcp-server"
    }
  }
}
```

#### For Cursor:
1. Settings → MCP Servers → Add Server
2. Enter the Apify MCP URL

---

## 💬 Example Commands

Once connected, just talk naturally to your AI:

| You Say | What Happens |
|---------|--------------|
| *"Send email to boss@company.com saying I'm sick today"* | Sends sick leave email |
| *"Write a professional follow-up email to hr@company.com about my job application"* | AI writes & sends |
| *"Email these 5 people about tomorrow's meeting: [emails]"* | Bulk sends meeting reminder |
| *"How many emails can I send today?"* | Shows rate limit status |

---

## 🔧 Available Tools

| Tool | What It Does |
|------|--------------|
| `send_email` | Send email to one or more recipients |
| `compose_and_send` | Describe intent, AI writes & sends |
| `send_bulk_emails` | Same email to multiple people |
| `check_email_status` | View remaining rate limits |
| `verify_connection` | Test Gmail connection |

---

## ⚠️ Rate Limits (Protecting Your Gmail)

| Limit | Default | Why |
|-------|---------|-----|
| Per Hour | 20 emails | Prevents spam flags |
| Per Day | 50 emails | Keeps account safe |
| Delay | 3-8 sec between sends | Looks natural to Gmail |

You can adjust these in the input settings, but we recommend keeping them low to protect your Gmail account.

---

## 🔒 Security & Privacy

- ✅ Your credentials are **encrypted** and stored securely on Apify
- ✅ Emails are sent from **your own Gmail** account
- ✅ We **never** read your emails or store email content
- ✅ You can revoke access anytime from [Google Account Settings](https://myaccount.google.com/permissions)

---

## ❓ Troubleshooting

**"Gmail connection failed"**
- Make sure Gmail API is enabled in Google Cloud Console
- Check that your refresh token is correct
- Verify your OAuth credentials have the right redirect URI

**"Rate limit exceeded"**
- Wait for the hourly limit to reset (resets every hour)
- Or wait until tomorrow for daily limit reset

**"Insufficient permissions"**
- Re-authorize with both `gmail.send` and `gmail.readonly` scopes
- Get a new refresh token from OAuth Playground

---

## 📞 Support

Need help? 
- 💬 [Join Apify Discord](https://discord.gg/apify)
- 📧 Contact the developer

---

## 📄 License

MIT License - Free to use for personal and commercial purposes.

---

**Made with ❤️ for the AI automation community**
