FROM apify/actor-node:20

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies including dev
RUN npm ci --include=dev

# Copy source files
COPY src/ ./src/

# Build TypeScript using local typescript
RUN ./node_modules/.bin/tsc

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Run the Actor
CMD ["node", "dist/actor.js"]
