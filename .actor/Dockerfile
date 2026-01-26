FROM apify/actor-node:20

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy source files
COPY src/ ./src/

# Build TypeScript
RUN npx tsc

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Run the MCP server
CMD ["node", "dist/server.js"]
