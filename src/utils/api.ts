// API Utilities for Lumon Backend
import { API_CONFIG, getApiUrl, getDefaultHeaders, getIdempotentHeaders } from '../config/api';
import { logger } from '../lib/logger';

// Re-export для удобства
export { getIdempotentHeaders };

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Message {
  id?: string;
  chat_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  created_at?: string;
}

export interface Chat {
  id?: string;
  user_id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  messageCount?: number;
  lastMessageAt?: string;
  lastMessage?: string;
}

export interface User {
  id?: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface AnalyticsEvent {
  action: string;
  resource?: string | null;
  resource_id?: string | null;
  meta?: Record<string, any>;
}

// API Response Types
export interface AuthInitResponse {
  success: boolean;
  data: {
    session_token: string;
    user: {
      id: string;
      telegram_id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    role: 'owner' | 'manager' | 'viewer';
    companyId: string | null;
  };
}

export interface AuthValidateResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      telegram_id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    role: 'owner' | 'manager' | 'viewer';
    companyId: string | null;
  };
}

export interface ChatListResponse {
  success: boolean;
  data: Chat[];
}

export interface SaveMessageResponse {
  success: boolean;
  data: Message;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: Message[];
}

export interface CreateChatResponse {
  success: boolean;
  data: Chat;
}

export interface CreateUserResponse {
  success: boolean;
  data: User;
}

export interface ApiErrorResponse {
  success: false;
  error?: string;
  message?: string;
}

// Network Error Types
type NetworkErrorType = 'offline' | 'timeout' | 'cors' | 'unknown';

// Helper function to determine network error type
const getNetworkErrorType = (error: unknown): NetworkErrorType => {
  if (error instanceof TypeError) {
    // Network error (offline, DNS failure, etc.)
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return 'offline';
    }
    // CORS error
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      return 'cors';
    }
  }
  
  if (error instanceof DOMException) {
    // AbortError = timeout
    if (error.name === 'AbortError') {
      return 'timeout';
    }
  }
  
  // Check for AbortError in Error instances
  if (error instanceof Error && error.name === 'AbortError') {
    return 'timeout';
  }
  
  return 'unknown';
};

// Helper function to get user-friendly error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const errorType = getNetworkErrorType(error);
  
  switch (errorType) {
    case 'offline':
      return 'Нет подключения к интернету. Проверьте соединение и попробуйте снова.';
    case 'timeout':
      return 'Превышено время ожидания ответа. Проверьте соединение и попробуйте снова.';
    case 'cors':
      return 'Ошибка подключения к серверу. Обратитесь в поддержку.';
    default:
      return error instanceof Error ? error.message : defaultMessage;
  }
};

// Re-auth function - повторная инициализация сессии
const reAuth = async (): Promise<boolean> => {
  try {
    // Проверяем наличие Telegram initData (проверяем и на undefined/null, и на пустую строку)
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData || initData.trim() === '') {
      logger.error('Re-auth failed: no Telegram initData');
      return false;
    }

    const response = await fetch(getApiUrl(API_CONFIG.endpoints.authInit), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        initData: initData,
        appVersion: '1.0.0',
      }),
      credentials: 'omit', // Не используем cookie, только Bearer token
    });

    if (!response.ok) {
      logger.error('Re-auth failed:', response.status);
      return false;
    }

    // Читаем JSON напрямую
    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      logger.error('[reAuth] Failed to parse response as JSON:', e);
      return false;
    }
    
    // Извлекаем токен из ответа (с fallback для разных структур)
    let token: string | undefined = 
      data?.data?.session_token || 
      data?.data?.token || 
      data?.token || 
      data?.session_token;
    
    if (data.success && token) {
      // Сохраняем новый токен и context
      localStorage.setItem('session_token', token);
      
      if (data.data?.user) {
        localStorage.setItem('user_context', JSON.stringify({
          userId: data.data.user.id,
          role: data.data.role || data.data.user.role || null,
          companyId: data.data.company_id || data.data.companyId || null,
        }));
      }
      
      logger.log('Re-auth successful');
      return true;
    }

    return false;
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Re-auth failed');
    logger.error('Re-auth error:', errorMessage);
    return false;
  }
};

// Helper function for retry logic with auth handling
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = API_CONFIG.retry.attempts,
  delay: number = API_CONFIG.retry.delay,
  isRetryAfterAuth: boolean = false
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    // Debug: логируем заголовки и body перед отправкой
    const bodyPreview = options.body 
      ? (typeof options.body === 'string' 
          ? options.body.substring(0, 200) 
          : '[Body is not a string]')
      : '[No body]';
    
    console.log('[fetchWithRetry] Request options:', {
      url,
      method: options.method,
      headers: options.headers,
      hasAuth: !!(options.headers as Record<string, string>)?.Authorization || !!(options.headers as Record<string, string>)?.authorization,
      bodyLength: options.body ? (typeof options.body === 'string' ? options.body.length : 'unknown') : 0,
      bodyPreview: bodyPreview
    });

    // Не используем credentials: 'include' так как cookie не используются
    // Это поможет избежать CORS проблем
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        credentials: 'omit', // Не используем cookie, только Bearer token
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorType = getNetworkErrorType(fetchError);
      console.error('[fetchWithRetry] ❌ Fetch error:', {
        errorType,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        url,
        method: options.method,
        hasAuthHeader: !!(options.headers as Record<string, string>)?.Authorization,
      });
      throw fetchError;
    }

    clearTimeout(timeoutId);

    // Обработка 401/403 - попытка повторной авторизации
    if ((response.status === 401 || response.status === 403) && !isRetryAfterAuth) {
      logger.warn(`Auth error ${response.status}, attempting re-auth...`);
      
      // Очищаем старый токен
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_context');
      
      // Пытаемся повторно авторизоваться
      const authSuccess = await reAuth();
      
      if (authSuccess) {
        // Обновляем заголовки с новым токеном
        const newHeaders = getDefaultHeaders();
        const updatedOptions = {
          ...options,
          headers: {
            ...options.headers,
            ...newHeaders,
          },
        };
        
        // Повторяем запрос с новым токеном (только один раз)
        return fetchWithRetry(url, updatedOptions, 0, delay, true);
      }
      
      // Если re-auth не удался, возвращаем ошибку
      throw new Error('Unauthorized: session expired');
    }

    // Обычная retry логика для других ошибок
    if (!response.ok && retries > 0 && response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay, isRetryAfterAuth);
    }

    return response;
  } catch (error) {
    const errorType = getNetworkErrorType(error);
    console.error('[fetchWithRetry] ❌ Request failed:', {
      errorType,
      error: error instanceof Error ? error.message : String(error),
      url,
      retriesLeft: retries,
    });
    
    // Retry только для network errors, не для auth errors
    if (retries > 0 && !(error instanceof Error && error.message.includes('Unauthorized'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay, isRetryAfterAuth);
    }
    throw error;
  }
};

// API Functions

// Auth init function - инициализация сессии
export const authInit = async (initData: string, appVersion: string = '1.0.0'): Promise<AuthInitResponse> => {
  const res = await fetch('https://n8n.psayha.ru/webhook/auth-init-v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ initData, appVersion })
  });

  try {
    const { logFetchResponse } = await import('./debugLogger').catch(() => ({ logFetchResponse: null as any }));
    if (logFetchResponse) await logFetchResponse(res);
  } catch {}

  let json: any;
  try {
    json = await res.clone().json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`auth-init-v2: failed to parse body: ${text.slice(0, 200)}`);
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `auth-init-v2 HTTP ${res.status}`);
  }

  const token = json?.data?.session_token;
  if (!token) throw new Error('auth-init-v2: no session_token in response');

  localStorage.setItem('session_token', token);
  console.log('[authInit] ✅ Token saved to localStorage:', token.substring(0, 20) + '...');
  
  if (json.data?.user) {
    localStorage.setItem('user_context', JSON.stringify({
      userId: json.data.user.id,
      role: json.data.role || json.data.user.role || null,
      companyId: json.data.company_id || json.data.companyId || null,
    }));
  }
  
  return json;
};

// Save message to database
export const saveMessage = async (message: Message): Promise<ApiResponse<Message>> => {
  try {
    const token = localStorage.getItem('session_token');
    const payload = {
      ...message,
      ...(token ? { session_token: token } : {})
    };
    
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.saveMessage),
      {
        method: 'POST',
        headers: getIdempotentHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText) as ApiErrorResponse;
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as SaveMessageResponse;
    
    // Валидация ответа
    if (!data.success || !data.data) {
      throw new Error('Invalid response: missing success or data');
    }
    
    if (!data.data.content) {
      throw new Error('Invalid response: missing required field content');
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Не удалось сохранить сообщение');
    logger.error('Error saving message:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Get chat list
export const getChatList = async (): Promise<ApiResponse<Chat[]>> => {
  try {
    // Проверяем наличие токена
    let token = localStorage.getItem('session_token');
    
    // Если токена нет, пытаемся повторно авторизоваться
    if (!token) {
      logger.warn('[getChatList] No token found, attempting re-auth...');
      const reAuthSuccess = await reAuth();
      if (reAuthSuccess) {
        token = localStorage.getItem('session_token');
      }
    }
    
    // Формируем URL с токеном в query параметрах (fallback для случаев, когда заголовок не передается)
    let url = getApiUrl(API_CONFIG.endpoints.chatList);
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}session_token=${encodeURIComponent(token)}`;
    }
    
    const response = await fetchWithRetry(
      url,
      {
        method: 'GET',
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText) as ApiErrorResponse;
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as ChatListResponse;
    
    // Валидация ответа
    if (!data.success) {
      throw new Error('Invalid response: missing success');
    }
    
    return { success: true, data: data.data || [] };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Не удалось загрузить список чатов');
    logger.error('Error fetching chat list:', error);
    return {
      success: false,
      error: errorMessage,
      data: [],
    };
  }
};

// Get chat history
export const getChatHistory = async (chatId: string): Promise<ApiResponse<Message[]>> => {
  try {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.chatGetHistory),
      {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText) as ApiErrorResponse;
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as ChatHistoryResponse;
    
    // Валидация ответа
    if (!data.success) {
      throw new Error('Invalid response: missing success');
    }
    
    return { success: true, data: data.data || [] };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Не удалось загрузить историю чата');
    logger.error('Error fetching chat history:', error);
    return {
      success: false,
      error: errorMessage,
      data: [],
    };
  }
};

// Create or update user
export const createUser = async (user: User): Promise<ApiResponse<User>> => {
  try {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.createUser),
      {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(user),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText) as ApiErrorResponse;
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as CreateUserResponse;
    
    // Валидация ответа
    if (!data.success || !data.data) {
      throw new Error('Invalid response: missing success or data');
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Не удалось создать пользователя');
    logger.error('Error creating user:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Create chat (без userId - используется session_token)
export const createChat = async (title?: string): Promise<ApiResponse<Chat>> => {
  const token = localStorage.getItem('session_token');
  if (!token) throw new Error('No session token in localStorage');

  const url = 'https://n8n.psayha.ru/webhook/chat-create?token=' + encodeURIComponent(token);
  const payload = { title: title || 'New Chat', session_token: token };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}` // Основной способ передачи токена
    },
    body: JSON.stringify(payload)
  });

  try {
    const { logFetchResponse } = await import('./debugLogger').catch(() => ({ logFetchResponse: null as any }));
    if (logFetchResponse) await logFetchResponse(res);
  } catch {}

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `chat-create HTTP ${res.status}`);
  }
  
  if (!json?.success || !json?.data) {
    throw new Error('Invalid response: missing success or data');
  }
  
  return { success: true, data: json.data };
};

// Track analytics event
export const trackEvent = async (event: AnalyticsEvent): Promise<ApiResponse<void>> => {
  try {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.analyticsLogEvent),
      {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText) as ApiErrorResponse;
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Не удалось отправить событие аналитики');
    logger.error('Error tracking event:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

