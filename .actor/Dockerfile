FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --omit=dev

# Copy built files
COPY dist/ ./dist/

# Run the MCP server in standby mode
CMD ["node", "dist/server.js"]
