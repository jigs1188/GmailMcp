import { getConfig } from './config.js';

interface RateLimitRecord {
  timestamp: number;
}

interface RateLimitState {
  hourlyRecords: RateLimitRecord[];
  dailyRecords: RateLimitRecord[];
}

const state: RateLimitState = {
  hourlyRecords: [],
  dailyRecords: []
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Clean up old records outside the time window
 */
function cleanupRecords(): void {
  const now = Date.now();

  // Remove records older than 1 hour
  state.hourlyRecords = state.hourlyRecords.filter(
    (record) => now - record.timestamp < ONE_HOUR_MS
  );

  // Remove records older than 24 hours
  state.dailyRecords = state.dailyRecords.filter(
    (record) => now - record.timestamp < ONE_DAY_MS
  );
}

/**
 * Check if we can send more emails
 */
export function canSendEmail(): {
  allowed: boolean;
  reason?: string;
  hourlyRemaining: number;
  dailyRemaining: number;
} {
  cleanupRecords();

  const config = getConfig();
  const hourlyCount = state.hourlyRecords.length;
  const dailyCount = state.dailyRecords.length;

  const hourlyRemaining = Math.max(0, config.rateLimit.maxPerHour - hourlyCount);
  const dailyRemaining = Math.max(0, config.rateLimit.maxPerDay - dailyCount);

  if (hourlyCount >= config.rateLimit.maxPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${config.rateLimit.maxPerHour}/hour). Please wait before sending more emails.`,
      hourlyRemaining,
      dailyRemaining
    };
  }

  if (dailyCount >= config.rateLimit.maxPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${config.rateLimit.maxPerDay}/day). Please try again tomorrow.`,
      hourlyRemaining,
      dailyRemaining
    };
  }

  return {
    allowed: true,
    hourlyRemaining,
    dailyRemaining
  };
}

/**
 * Record an email being sent
 */
export function recordEmailSent(): void {
  const now = Date.now();
  const record: RateLimitRecord = { timestamp: now };

  state.hourlyRecords.push(record);
  state.dailyRecords.push(record);
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): {
  hourlyCount: number;
  hourlyLimit: number;
  hourlyRemaining: number;
  dailyCount: number;
  dailyLimit: number;
  dailyRemaining: number;
} {
  cleanupRecords();

  const config = getConfig();

  return {
    hourlyCount: state.hourlyRecords.length,
    hourlyLimit: config.rateLimit.maxPerHour,
    hourlyRemaining: Math.max(0, config.rateLimit.maxPerHour - state.hourlyRecords.length),
    dailyCount: state.dailyRecords.length,
    dailyLimit: config.rateLimit.maxPerDay,
    dailyRemaining: Math.max(0, config.rateLimit.maxPerDay - state.dailyRecords.length)
  };
}

/**
 * Check how many emails can be sent from a batch
 */
export function getMaxBatchSize(requested: number): number {
  const status = canSendEmail();
  
  if (!status.allowed) {
    return 0;
  }

  // Return the minimum of: requested, hourly remaining, daily remaining
  return Math.min(requested, status.hourlyRemaining, status.dailyRemaining);
}

/**
 * Get random delay for sending (to avoid spam detection)
 * Returns delay in milliseconds
 */
export function getRandomDelay(): number {
  // Random delay between 3-8 seconds
  const minDelay = 3000;
  const maxDelay = 8000;
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
