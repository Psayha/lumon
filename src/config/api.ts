// API Configuration for Lumon Backend
// Backend runs on n8n webhooks
// Production: https://n8n.psayha.ru
// Development: http://localhost:5678 или http://91.229.10.47:5678

export const API_CONFIG = {
  // Base URL for n8n webhooks
  // В продакшене используем https://n8n.psayha.ru
  // Локально: создай .env.local с VITE_API_URL=http://localhost:5678
  // Или установи через: export VITE_API_URL=http://localhost:5678 (Linux/Mac) или set VITE_API_URL=http://localhost:5678 (Windows)
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n8n.psayha.ru' : 'http://localhost:5678'),
  
  // API endpoints
  endpoints: {
    // Auth endpoints
    authInit: '/webhook/auth-init-v2',
    authValidate: '/webhook/auth-validate-v2',
    authRefresh: '/webhook/auth-refresh',
    authLogout: '/webhook/auth-logout',
    
    // Chat endpoints (обновлено с auth.validate)
    chatCreate: '/webhook/chat-create',
    chatGetHistory: '/webhook/chat-get-history',
    chatSaveMessage: '/webhook/chat-save-message',
    
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
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Headers для идемпотентных запросов (mutating operations)
export const getIdempotentHeaders = (): Record<string, string> => {
  const headers = getDefaultHeaders();
  headers['Idempotency-Key'] = crypto.randomUUID();
  return headers;
};

