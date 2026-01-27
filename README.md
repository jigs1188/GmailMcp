# 📧 Gmail MCP Server - Control your Inbox with AI

Gmail MCP Server is a powerful bridge between your AI assistant (ChatGPT, Claude, Cursor) and your Gmail account. It allows AI models to read, compose, and send emails securely using the Model Context Protocol. By hosting this on Railway, you get a 24/7 cloud-based email automation engine that works everywhere.

---

## 🚀 Deploy on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/jigs1188/MCP-mail)

## About Hosting Gmail MCP Sever

Deploying the Gmail MCP Server on Railway involves setting up a persistent Node.js environment that communicates with Google's OAuth 2.0 servers. Railway simplifies this by providing a managed container service that handles the server lifecycle, SSL encryption, and environment variable management. 

When you deploy, Railway builds your TypeScript code into a production-ready JavaScript bundle and exposes an SSE (Server-Sent Events) endpoint. This endpoint allows AI clients like ChatGPT to securely send JSON-RPC requests to your server. By using Railway, you avoid the hassle of local port forwarding (like Ngrok) and ensure your email tools are available whenever you need them, without keeping your laptop running.

## Common Use Cases

- **AI Follow-ups:** Tell ChatGPT to summarize a thread and send a follow-up email automatically.
- **Automated Reporting:** Connect your AI to data sources and have it draft and send weekly progress emails to your team.
- **Smart Inbox Management:** Use AI to filter, categorize, or respond to common inquiries directly through a chat interface.

## Dependencies for Gmail MCP Sever Hosting

- **Google Cloud Console Account:** To create OAuth 2.0 credentials (Client ID and Secret).
- **Railway Account:** For cloud hosting and server management.

### Deployment Dependencies

- [Google OAuth Playground](https://developers.google.com/oauthplayground) (Required to generate your persistent Refresh Token)
- [Railway Dashboard](https://railway.app/dashboard)
- [Model Context Protocol (MCP) Guide](https://modelcontextprotocol.io)

---

## ⚠️ Important: AI Model Support (Read Before Buying)

| AI Assistant | Tier Required | Platform |
|--------------|---------------|----------|
| **ChatGPT**  | **Plus / Team / Enterprise** | Web & Desktop |
| **Claude**   | **Free or Paid** | **Desktop App Only** |
| **Cursor**   | **Free or Paid** | IDE (Desktop) |

**Note for ChatGPT users:** You **must** have a paid subscription (ChatGPT Plus) to add custom MCP servers via the "Connectors" setting. Claude users can use this for free, but only via the Claude Desktop application.

---

## ⚡ Features

| Feature | Description |
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
