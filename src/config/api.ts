// API Configuration for Lumon Backend
// Backend: NestJS API (migrated from n8n on Nov 16, 2025)
// Production: Set VITE_API_URL environment variable
// Development: http://localhost:3000

// SECURITY: Production URL must be set via VITE_API_URL environment variable
// See .env.example for configuration details
const getBaseUrl = (): string => {
  // Always prefer environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Development fallback
  if (!import.meta.env.PROD) {
    return 'http://localhost:3000';
  }

  // Production requires explicit configuration
  console.error(
    '[API Config] VITE_API_URL not set in production! ' +
    'Please set VITE_API_URL environment variable. ' +
    'See .env.example for details.'
  );

  // Fallback to relative URL (will use current host)
  return '';
};

export const API_CONFIG = {
  // Base URL for NestJS API
  // MUST be configured via VITE_API_URL environment variable in production
  baseUrl: getBaseUrl(),
  
  // API endpoints
  endpoints: {
    // Auth endpoints
    authInit: '/webhook/auth-init-v2',
    authValidate: '/webhook/auth-validate-v2',
    authRefresh: '/webhook/auth-refresh',
    authLogout: '/webhook/auth-logout',
    
    // Chat endpoints (обновлено с auth.validate)
    chatCreate: '/webhook/chat-create',
    chatList: '/webhook/chat-list',
    chatGetHistory: '/webhook/chat-get-history',
    chatSaveMessage: '/webhook/chat-save-message',
    chatDelete: '/webhook/chat-delete',
    
    // Analytics (обновлено с auth.validate)
    analyticsLogEvent: '/webhook/analytics-log-event',
    
    // Legacy endpoints (для обратной совместимости)
    saveMessage: '/webhook/save-message',
    getChatHistory: '/webhook/get-chat-history',
    createChat: '/webhook/create-chat',
    createUser: '/webhook/create-user',
    getUser: '/webhook/get-user',
    trackEvent: '/webhook/analytics',

    // Agents
    agentsGetDefault: '/agents/default',
  },
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // ms
  },
};

// Helper function to build full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

// Default headers for API requests
export const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Добавляем Authorization токен если есть
  const token = localStorage.getItem('session_token');
  if (token && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return headers;
};

// Headers для идемпотентных запросов (mutating operations)
export const getIdempotentHeaders = (): Record<string, string> => {
  const headers = getDefaultHeaders();
  headers['Idempotency-Key'] = crypto.randomUUID();
  return headers;
};

