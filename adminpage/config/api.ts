// API Configuration for Admin Panel
// Backend: NestJS API (migrated from n8n on Nov 16, 2025)
// Production: Set VITE_API_URL environment variable
// Development: http://localhost:3000

// SECURITY: Production URL must be set via VITE_API_URL environment variable
// See .env.example for configuration details
const getAdminBaseUrl = (): string => {
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
    '[Admin API Config] VITE_API_URL not set in production! ' +
    'Please set VITE_API_URL environment variable. ' +
    'See .env.example for details.'
  );

  // Fallback to relative URL (will use current host)
  return '';
};

export const ADMIN_API_CONFIG = {
  baseUrl: getAdminBaseUrl(),
  
  endpoints: {
    // Admin Auth
    adminLogin: '/webhook/admin/login',
    adminValidate: '/webhook/admin/validate',
    adminLogout: '/webhook/admin/logout',

    // Admin Companies
    adminCompaniesList: '/webhook/admin/companies-list',

    // Admin Legal Docs
    adminLegalDocsList: '/webhook/admin/legal-docs-list',
    adminLegalDocsCreate: '/webhook/admin/legal-docs-create',
    adminLegalDocsUpdate: '/webhook/admin/legal-docs-update',
    adminLegalDocsDelete: '/webhook/admin/legal-docs-delete',

    // Admin AI Docs (Stub endpoints - returns empty array)
    adminAiDocsList: '/webhook/admin/ai-docs-list',
    adminAiDocsDelete: '/webhook/admin/ai-docs-delete',

    // Admin Backups (Fully migrated with security fixes)
    backupList: '/webhook/admin/backup-list',
    backupCreate: '/webhook/admin/backup-create',
    backupRestore: '/webhook/admin/backup-restore',
    backupDelete: '/webhook/admin/backup-delete',

    // Admin Health Checks (Fully migrated)
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
    adminUserBindCompany: '/webhook/admin/user-bind-company',
    adminUserUnbindCompany: '/webhook/admin/user-unbind-company',

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
// SECURITY: Authentication uses httpOnly cookies (set by backend)
// Cookies are sent automatically by browser - no need for Authorization header
export const getAdminHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Note: admin_token cookie is sent automatically by browser
    // No need to manually add Authorization header
  };
};

// Helper function for making admin API requests
export const adminApiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; pagination?: { page: number; limit: number; total: number } }> => {
  const url = endpoint.startsWith('http') ? endpoint : getAdminApiUrl(endpoint);
  const headers = getAdminHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // CRITICAL: Send httpOnly cookies with request
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    let data: unknown;

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
      } catch {
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
        data: responseText as T,
      };
    }

    if (!response.ok) {
      const parsedData = data as { message?: string; error?: string; data?: T };
      const errorMessage = parsedData?.message || parsedData?.error || `Ошибка сервера: ${response.status} ${response.statusText || 'Internal Server Error'}`;
      return {
        success: false,
        message: errorMessage,
        data: parsedData?.data,
      };
    }

    return data as { success: boolean; data?: T; message?: string; pagination?: { page: number; limit: number; total: number } };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка подключения к серверу';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

