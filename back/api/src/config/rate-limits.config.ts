/**
 * Rate Limit Configuration
 * SECURITY: Server-side rate limit definitions
 * Never allow client to control these values!
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  // Chat endpoints
  'chat-save-message': {
    maxRequests: 30,
    windowMinutes: 1,
  },
  'chat-list': {
    maxRequests: 100,
    windowMinutes: 1,
  },
  'chat-history': {
    maxRequests: 50,
    windowMinutes: 1,
  },
  'chat-create': {
    maxRequests: 10,
    windowMinutes: 1,
  },
  'chat-delete': {
    maxRequests: 20,
    windowMinutes: 1,
  },

  // Analytics endpoints
  'analytics-log-event': {
    maxRequests: 100,
    windowMinutes: 1,
  },

  // Default for unknown endpoints
  default: {
    maxRequests: 60,
    windowMinutes: 1,
  },
};

/**
 * Get rate limit config for endpoint
 * SECURITY: Always use server-defined limits
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return RATE_LIMIT_CONFIG[endpoint] || RATE_LIMIT_CONFIG.default;
}
