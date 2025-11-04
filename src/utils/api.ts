// API Utilities for Lumon Backend
import { API_CONFIG, getApiUrl, getDefaultHeaders, getIdempotentHeaders } from '../config/api';

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

// Re-auth function - повторная инициализация сессии
const reAuth = async (): Promise<boolean> => {
  try {
    // Проверяем наличие Telegram initData
    if (!window.Telegram?.WebApp?.initData) {
      console.error('Re-auth failed: no Telegram initData');
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
      console.error('Re-auth failed:', response.status);
      return false;
    }

    const data = await response.json();
    
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
      
      console.log('Re-auth successful');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Re-auth error:', error);
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

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Обработка 401/403 - попытка повторной авторизации
    if ((response.status === 401 || response.status === 403) && !isRetryAfterAuth) {
      console.warn(`Auth error ${response.status}, attempting re-auth...`);
      
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
        headers: getDefaultHeaders(),
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error saving message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save message',
    };
  }
};

// Get chat history
export const getChatHistory = async (chatId: string): Promise<ApiResponse<Message[]>> => {
  try {
    const response = await fetchWithRetry(
      `${getApiUrl(API_CONFIG.endpoints.getChatHistory)}?chat_id=${chatId}`,
      {
        method: 'GET',
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chat history',
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
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
};

// Create chat
export const createChat = async (userId: string, title?: string): Promise<ApiResponse<Chat>> => {
  try {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.endpoints.createChat),
      {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ user_id: userId, title }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating chat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chat',
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
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track event',
    };
  }
};

