FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/

# Set environment variables (override these at runtime)
ENV NODE_ENV=production
ENV PORT=3000

# The MCP server uses stdio, but we can also expose HTTP for health checks
EXPOSE 3000

# Run the server
CMD ["node", "dist/server.js"]
