// API Configuration for Lumon Backend
// Backend runs on n8n webhooks
// Production: https://n8n.psayha.ru
// Development: http://localhost:5678 или http://91.229.10.47:5678

export const API_CONFIG = {
  // Base URL for n8n webhooks
  // Локально: создай .env.local с VITE_API_URL=http://91.229.10.47:5678
  // Или установи через: export VITE_API_URL=http://91.229.10.47:5678 (Linux/Mac) или set VITE_API_URL=http://91.229.10.47:5678 (Windows)
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5678',
  
  // API endpoints
  endpoints: {
    // Chat endpoints
    saveMessage: '/webhook/save-message',
    getChatHistory: '/webhook/get-chat-history',
    createChat: '/webhook/create-chat',
    
    // User endpoints
    createUser: '/webhook/create-user',
    getUser: '/webhook/get-user',
    
    // Analytics
    trackEvent: '/webhook/analytics',
    
    // Documents (future)
    uploadDocument: '/webhook/upload-document',
    getDocuments: '/webhook/get-documents',
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
export const getDefaultHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

