// API Utilities for Lumon Backend
import { API_CONFIG, getApiUrl, getDefaultHeaders } from '../config/api';

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

// Helper function for retry logic
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = API_CONFIG.retry.attempts,
  delay: number = API_CONFIG.retry.delay
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
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

