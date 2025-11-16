// API Configuration for Lumon Backend
// Backend: NestJS API (migrated from n8n on Nov 16, 2025)
// Production: https://n8n.psayha.ru (NestJS API on port 3000)
// Development: http://localhost:3000

export const API_CONFIG = {
  // Base URL for NestJS API
  // Production: https://n8n.psayha.ru → nginx → NestJS (port 3000)
  // Development: http://localhost:3000
  // Override with VITE_API_URL environment variable if needed
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n8n.psayha.ru' : 'http://localhost:3000'),
  
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

