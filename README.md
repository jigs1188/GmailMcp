# Gmail MCP Server

A general-purpose Model Context Protocol (MCP) server for sending emails via Gmail API. Works with ChatGPT, Claude, Cursor, and other MCP-compatible AI assistants.

**🚀 Deploy on Apify and get paid when people use your Actor!**

## Features

- **Send Any Email**: Personal, professional, follow-ups, newsletters
- **Compose with AI**: Describe what you want and let AI write it
- **Bulk Sending**: Send to multiple recipients with personalization
- **CC/BCC Support**: Full email header support
- **Rate Limiting**: Built-in protection (10/hour, 50/day)
- **Monetization**: Publish on Apify Store and earn money

---

## 🎯 Deployment Options

### Option 1: Apify (Recommended - Get Paid!)

Apify hosts your MCP server AND lets you monetize it.

1. **Install Apify CLI**
   ```bash
   npm install -g apify-cli
   apify login
   ```

2. **Deploy to Apify**
   ```bash
   npm run build
   apify push
   ```

3. **Configure on Apify Console**
   - Go to your Actor settings
   - Add environment variables (Gmail credentials)
   - Enable "Standby" mode for 24/7 availability

4. **Your MCP URL**
   ```
   https://mcp.apify.com/?actors=YOUR_USERNAME/gmail-mcp-server
   ```

5. **Monetize**
   - Publish to Apify Store
   - Set your pricing
   - Earn when others use it!

### Option 2: Smithery

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/gmail-mcp.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add environment variables (from your `.env`)
   - Railway will auto-deploy

3. **Get your MCP URL**
   ```
   https://your-app.railway.app
   ```

### Option 2: Render

1. **Push to GitHub** (same as above)

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect your GitHub repo
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables

3. **Get your URL**
   ```
   https://your-app.onrender.com
   ```

### Option 3: Fly.io

1. **Install Fly CLI**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Deploy**
   ```bash
   fly auth login
   fly launch
   fly secrets set GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=xxx GMAIL_REFRESH_TOKEN=xxx GMAIL_USER_EMAIL=xxx
   fly deploy
   ```

### Option 4: Docker (Any Cloud)

Build and push to any container registry:

```bash
# Build
docker build -t gmail-mcp .

# Run locally (test)
docker run -p 3000:3000 --env-file .env gmail-mcp

# Push to Docker Hub
docker tag gmail-mcp YOUR_USERNAME/gmail-mcp
docker push YOUR_USERNAME/gmail-mcp
```

Then deploy to:
- Google Cloud Run
- AWS ECS/Fargate
- Azure Container Apps
- DigitalOcean App Platform

---

## Connecting to ChatGPT

### For Local Development

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["C:/path/to/gmail-mcp/dist/server.js"]
    }
  }
}
```

### For Cloud Deployment

Once deployed, use your server URL in ChatGPT's MCP settings:

1. Go to ChatGPT → Settings → Developer Mode → New MCP App
2. Enter your deployed URL:
   ```
   https://your-app.railway.app/mcp/sse
   ```
3. Configure authentication if needed
4. Accept and connect

---

## Example Usage in ChatGPT

**Simple email:**
> "Send an email to john@example.com saying I'll be 10 minutes late to our meeting"

**Professional email:**
> "Write and send a professional email to hr@company.com following up on my job application"

**Bulk emails:**
> "Send a meeting reminder to these 5 people: [emails]"

**Check status:**
> "How many emails can I still send today?"

---

## Security Notes

- ⚠️ Never commit `.env` file
- ⚠️ Use environment variables in production
- ⚠️ Refresh token doesn't expire (keep it secure)
- ✅ Rate limiting protects your Gmail account
- ✅ All emails sent from your verified Gmail

---

## Troubleshooting

**"Gmail connection failed"**
- Check credentials in `.env`
- Run `npm run auth` for new token
- Verify Gmail API is enabled

**"Rate limit exceeded"**
- Wait for hourly/daily reset
- Check status with `check_email_status`

**Deployment issues**
- Ensure all env vars are set in cloud platform
- Check build logs for errors
- Verify Node.js 18+ is used

---

## License

MIT
