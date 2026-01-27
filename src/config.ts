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
let apifyInput: Record<string, unknown> | null = null;

/**
 * Load Apify Actor input if running on Apify platform
 */
function loadApifyInputSync(): Record<string, unknown> | null {
  if (apifyInput) return apifyInput;
  
  try {
    // Method 1: ACTOR_INPUT_* environment variables (Apify Standby mode)
    if (process.env.ACTOR_INPUT_gmailClientId) {
      console.log('[Config] Loading from ACTOR_INPUT_* env vars');
      apifyInput = {
        gmailClientId: process.env.ACTOR_INPUT_gmailClientId,
        gmailClientSecret: process.env.ACTOR_INPUT_gmailClientSecret,
        gmailRefreshToken: process.env.ACTOR_INPUT_gmailRefreshToken,
        gmailUserEmail: process.env.ACTOR_INPUT_gmailUserEmail,
        maxEmailsPerHour: process.env.ACTOR_INPUT_maxEmailsPerHour,
        maxEmailsPerDay: process.env.ACTOR_INPUT_maxEmailsPerDay
      };
      return apifyInput;
    }

    // Method 2: APIFY_INPUT_* environment variables
    if (process.env.APIFY_INPUT_gmailClientId) {
      console.log('[Config] Loading from APIFY_INPUT_* env vars');
      apifyInput = {
        gmailClientId: process.env.APIFY_INPUT_gmailClientId,
        gmailClientSecret: process.env.APIFY_INPUT_gmailClientSecret,
        gmailRefreshToken: process.env.APIFY_INPUT_gmailRefreshToken,
        gmailUserEmail: process.env.APIFY_INPUT_gmailUserEmail,
        maxEmailsPerHour: process.env.APIFY_INPUT_maxEmailsPerHour,
        maxEmailsPerDay: process.env.APIFY_INPUT_maxEmailsPerDay
      };
      return apifyInput;
    }

    // Method 3: Read from Apify key-value store (file-based)
    const kvStorePath = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
    if (kvStorePath) {
      const inputPath = path.join(kvStorePath, 'INPUT.json');
      if (fs.existsSync(inputPath)) {
        console.log('[Config] Loading from key-value store:', inputPath);
        apifyInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
        return apifyInput;
      }
    }

    // Method 4: Local apify_storage folder
    const localInputPath = path.join(process.cwd(), 'apify_storage', 'key_value_stores', 'default', 'INPUT.json');
    if (fs.existsSync(localInputPath)) {
      console.log('[Config] Loading from local apify_storage');
      apifyInput = JSON.parse(fs.readFileSync(localInputPath, 'utf-8'));
      return apifyInput;
    }

    // Method 5: APIFY_INPUT as JSON string
    if (process.env.APIFY_INPUT) {
      console.log('[Config] Loading from APIFY_INPUT env var');
      apifyInput = JSON.parse(process.env.APIFY_INPUT);
      return apifyInput;
    }
  } catch (error) {
    console.error('[Config] Error loading Apify input:', error);
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

  // Try to load from Apify input first
  const input = loadApifyInputSync();
  
  // Get credentials - prioritize Apify input, then env vars
  const clientId = (input?.gmailClientId as string) || process.env.GMAIL_CLIENT_ID;
  const clientSecret = (input?.gmailClientSecret as string) || process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = (input?.gmailRefreshToken as string) || process.env.GMAIL_REFRESH_TOKEN;
  const userEmail = (input?.gmailUserEmail as string) || process.env.GMAIL_USER_EMAIL;

  console.log('[Config] Credentials loaded:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken,
    hasUserEmail: !!userEmail,
    userEmail: userEmail ? userEmail.substring(0, 5) + '***' : 'none'
  });

  if (!clientId || !clientSecret || !refreshToken || !userEmail) {
    throw new Error(
      'Missing required Gmail credentials. Please configure them in Apify Actor Input or set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_USER_EMAIL environment variables.'
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
      maxPerHour: parseInt((input?.maxEmailsPerHour as string) || process.env.MAX_EMAILS_PER_HOUR || '20', 10),
      maxPerDay: parseInt((input?.maxEmailsPerDay as string) || process.env.MAX_EMAILS_PER_DAY || '50', 10)
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
