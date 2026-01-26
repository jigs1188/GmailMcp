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
 * Load Apify Actor input if running on Apify platform
 */
async function loadApifyInput(): Promise<Record<string, unknown> | null> {
  try {
    // Check if running on Apify
    const inputPath = process.env.APIFY_INPUT_KEY 
      ? path.join(process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID || '', 'INPUT')
      : path.join(process.cwd(), 'apify_storage', 'key_value_stores', 'default', 'INPUT.json');
    
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath, 'utf-8');
      return JSON.parse(content);
    }
    
    // Try environment variable (Apify passes input as env var too)
    if (process.env.APIFY_INPUT) {
      return JSON.parse(process.env.APIFY_INPUT);
    }
  } catch {
    // Not on Apify or no input
  }
  return null;
}

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
 * Get configuration from environment variables or Apify input
 */
export function getConfig(): Config {
  if (config) {
    return config;
  }

  // Load .env file if it exists (for local development)
  loadEnvFile();

  // Check for Apify environment variables (set by Apify platform)
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.APIFY_ACTOR_INPUT_GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.APIFY_ACTOR_INPUT_GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.APIFY_ACTOR_INPUT_GMAIL_REFRESH_TOKEN;
  const userEmail = process.env.GMAIL_USER_EMAIL || process.env.APIFY_ACTOR_INPUT_GMAIL_USER_EMAIL;

  if (!clientId || !clientSecret || !refreshToken || !userEmail) {
    throw new Error(
      'Missing required Gmail credentials. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_USER_EMAIL.'
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
      maxPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || process.env.APIFY_ACTOR_INPUT_MAX_EMAILS_PER_HOUR || '10', 10),
      maxPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY || process.env.APIFY_ACTOR_INPUT_MAX_EMAILS_PER_DAY || '50', 10)
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
