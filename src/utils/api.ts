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
  event_type: string;
  event_data?: Record<string, any>;
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
    // Проверяем наличие Telegram initData
    if (!window.Telegram?.WebApp?.initData) {
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
        initData: window.Telegram.WebApp.initData,
        appVersion: '1.0.0',
      }),
    });

    if (!response.ok) {
      logger.error('Re-auth failed:', response.status);
      return false;
    }

    const data = await response.json() as AuthInitResponse;
    
    if (data.success && data.data?.session_token) {
      // Сохраняем новый токен и context
      localStorage.setItem('session_token', data.data.session_token);
      
      if (data.data.user) {
        localStorage.setItem('user_context', JSON.stringify({
          userId: data.data.user.id,
          role: data.data.role,
          companyId: data.data.companyId,
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

    // Debug: логируем заголовки перед отправкой
    console.log('[fetchWithRetry] Request options:', {
      url,
      method: options.method,
      headers: options.headers,
      hasAuth: !!(options.headers as Record<string, string>)?.Authorization || !!(options.headers as Record<string, string>)?.authorization
    });

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

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
    // Retry только для network errors, не для auth errors
    if (retries > 0 && !(error instanceof Error && error.message.includes('Unauthorized'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay, isRetryAfterAuth);
    }
    throw error;
  }
};

// API Functions

// Save message to database
export const saveMessage = async (message: Message): Promise<ApiResponse<Message>> => {
  try {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.saveMessage),
      {
        method: 'POST',
        headers: getIdempotentHeaders(),
        body: JSON.stringify(message),
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
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.chatList),
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
  try {
    const headers = getDefaultHeaders();
    const token = localStorage.getItem('session_token');
    
    // Debug: логируем заголовки перед отправкой
    console.log('[createChat] Headers before request:', JSON.stringify(headers, null, 2));
    console.log('[createChat] Token in localStorage:', token ? token.substring(0, 20) + '...' : 'MISSING');
    console.log('[createChat] Full URL:', getApiUrl(API_CONFIG.endpoints.chatCreate));
    
    if (token) {
      logger.log('[createChat] Token exists, calling API...');
    } else {
      logger.warn('[createChat] No token, calling API anyway (workflow will return 401)');
    }
    
    // Временное решение: отправляем токен в body, т.к. заголовок Authorization не приходит в webhook
    // TODO: исправить проблему с передачей Authorization заголовка в n8n webhook
    const bodyData: Record<string, any> = { title };
    if (token) {
      bodyData.session_token = token;
    }
    
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.chatCreate),
      {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData),
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

    const data = await response.json() as CreateChatResponse;
    
    // Валидация ответа
    if (!data.success || !data.data) {
      throw new Error('Invalid response: missing success or data');
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Не удалось создать чат');
    logger.error('Error creating chat:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Track analytics event
export const trackEvent = async (event: AnalyticsEvent): Promise<ApiResponse<void>> => {
  try {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.trackEvent),
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

