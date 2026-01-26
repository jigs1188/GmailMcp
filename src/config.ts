import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
  gmail: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    userEmail: string;
  };
  rateLimit: {
    maxPerHour: number;
    maxPerDay: number;
  };
  server: {
    port: number;
  };
}

let config: Config | null = null;

/**
 * Load environment variables from .env file
 */
function loadEnvFile(): void {
  const envPath = path.resolve(__dirname, '..', '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

/**
 * Get configuration from environment variables
 */
export function getConfig(): Config {
  if (config) {
    return config;
  }

  // Load .env file if it exists
  loadEnvFile();

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const userEmail = process.env.GMAIL_USER_EMAIL;

  if (!clientId || !clientSecret || !refreshToken || !userEmail) {
    throw new Error(
      'Missing required Gmail credentials. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_USER_EMAIL in your .env file.'
    );
  }

  config = {
    gmail: {
      clientId,
      clientSecret,
      refreshToken,
      userEmail
    },
    rateLimit: {
      maxPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '10', 10),
      maxPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY || '50', 10)
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10)
    }
  };

  return config;
}

/**
 * Validate configuration on startup
 */
export function validateConfig(): boolean {
  try {
    getConfig();
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}
