// API Configuration for Admin Panel
// Backend runs on n8n webhooks
// Production: https://n8n.psayha.ru
// Development: http://localhost:5678

export const ADMIN_API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n8n.psayha.ru' : 'http://localhost:5678'),
  
  endpoints: {
    // Admin Auth
    adminLogin: '/webhook/admin-login',
    adminValidate: '/webhook/admin-validate',
    
    // Admin Companies
    adminCompaniesList: '/webhook/admin-companies-list',
    
    // Admin Legal Docs
    adminLegalDocsList: '/webhook/admin-legal-docs-list',
    adminLegalDocsUpdate: '/webhook/admin-legal-docs-update',
    
    // Admin AI Docs
    adminAiDocsList: '/webhook/admin-ai-docs-list',
    adminAiDocsDelete: '/webhook/admin-ai-docs-delete',
    
    // Admin Backups
    backupList: '/webhook/backup-list',
    backupCreate: '/webhook/backup-create',
    backupRestore: '/webhook/backup-restore',
    backupDelete: '/webhook/backup-delete',
    
    // Admin Health Checks
    healthCheckList: '/webhook/health-check-list',
    healthCheck: '/webhook/health-check',
    
    // Admin Logs
    adminLogsList: '/webhook/admin-logs-list',
    
    // Admin Users
    adminUsersList: '/webhook/admin-users-list',
    adminUserLimitsList: '/webhook/admin-user-limits-list',
    adminUserLimitsUpdate: '/webhook/admin-user-limits-update',
    
    // Admin Analytics
    adminStatsPlatform: '/webhook/admin-stats-platform',
    
    // Admin AB Testing
    adminAbExperimentsList: '/webhook/admin-ab-experiments-list',
    adminAbExperimentCreate: '/webhook/admin-ab-experiment-create',
    adminAbExperimentUpdate: '/webhook/admin-ab-experiment-update',
  },
  
  timeout: 30000,
};

// Helper function to build full URL
export const getAdminApiUrl = (endpoint: string): string => {
  return `${ADMIN_API_CONFIG.baseUrl}${endpoint}`;
};

// Default headers for Admin API requests
export const getAdminHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = localStorage.getItem('admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function for making admin API requests
export const adminApiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; pagination?: any }> => {
  // Если endpoint уже содержит полный URL (начинается с http), используем его напрямую
  const url = endpoint.startsWith('http') ? endpoint : getAdminApiUrl(endpoint);
  const headers = getAdminHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    // Проверяем Content-Type перед парсингом JSON
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Неверный формат ответа от сервера');
      }
    } else {
      // Если ответ не JSON, возвращаем ошибку
      const text = await response.text();
      throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}. ${text.substring(0, 100)}`);
    }

    // Если ответ не успешный, но есть данные, возвращаем их
    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
      console.error('API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        data,
      });
      return {
        success: false,
        message: errorMessage,
        data: data.data,
      };
    }

    return data;
  } catch (error: any) {
    console.error('Admin API request error:', {
      url,
      error: error.message,
      stack: error.stack,
    });
    
    // Возвращаем структурированную ошибку вместо throw
    return {
      success: false,
      message: error.message || 'Ошибка подключения к серверу',
    };
  }
};

