// API Configuration for Admin Panel
// Backend: NestJS API (migrated from n8n on Nov 16, 2025)
// Production: https://n8n.psayha.ru (NestJS API on port 3000)
// Development: http://localhost:3000

export const ADMIN_API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n8n.psayha.ru' : 'http://localhost:3000'),
  
  endpoints: {
    // Admin Auth
    adminLogin: '/webhook/admin/login',
    adminValidate: '/webhook/admin/validate',

    // Admin Companies
    adminCompaniesList: '/webhook/admin/companies-list',

    // Admin Legal Docs (Not yet migrated)
    adminLegalDocsList: '/webhook/admin/legal-docs-list',
    adminLegalDocsUpdate: '/webhook/admin/legal-docs-update',

    // Admin AI Docs (Not yet migrated)
    adminAiDocsList: '/webhook/admin/ai-docs-list',
    adminAiDocsDelete: '/webhook/admin/ai-docs-delete',

    // Admin Backups (Not yet migrated)
    backupList: '/webhook/admin/backup-list',
    backupCreate: '/webhook/admin/backup-create',
    backupRestore: '/webhook/admin/backup-restore',
    backupDelete: '/webhook/admin/backup-delete',

    // Admin Health Checks (Not yet migrated)
    healthCheckList: '/webhook/admin/health-check-list',
    healthCheck: '/webhook/admin/health-check',

    // Admin Logs
    adminLogsList: '/webhook/admin/logs-list',

    // Admin Users
    adminUsersList: '/webhook/admin/users-list',
    adminUserLimitsList: '/webhook/admin/user-limits-list',
    adminUserLimitsUpdate: '/webhook/admin/user-limits-update',
    adminUserHistoryClear: '/webhook/admin/user-history-clear',
    adminUserDelete: '/webhook/admin/user-delete',

    // Admin Analytics
    adminStatsPlatform: '/webhook/admin/stats-platform',

    // Admin AB Testing
    adminAbExperimentsList: '/webhook/admin/ab-experiments-list',
    adminAbExperimentCreate: '/webhook/admin/ab-experiment-create',
    adminAbExperimentUpdate: '/webhook/admin/ab-experiment-update',
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

    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    let data: any;

    if (!responseText || responseText.trim() === '') {
      if (!response.ok) {
        return {
          success: false,
          message: `Ошибка сервера: ${response.status} ${response.statusText || 'Internal Server Error'}`,
        };
      }
      return {
        success: true,
        data: undefined,
      };
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        return {
          success: false,
          message: `Ошибка сервера ${response.status}: Неверный формат ответа`,
        };
      }
    } else {
      if (!response.ok) {
        return {
          success: false,
          message: `Ошибка сервера ${response.status}: ${responseText.substring(0, 200)}`,
        };
      }
      return {
        success: true,
        data: responseText as any,
      };
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Ошибка сервера: ${response.status} ${response.statusText || 'Internal Server Error'}`;
      return {
        success: false,
        message: errorMessage,
        data: data?.data,
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Ошибка подключения к серверу',
    };
  }
};

