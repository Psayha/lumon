import React, { useEffect, useState } from 'react';
import { API_CONFIG, getApiUrl, getDefaultHeaders } from '../config/api';
import { ModernSplashScreen } from './ModernSplashScreen';
import { logger } from '../lib/logger';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем наличие существующего токена
        const existingToken = localStorage.getItem('session_token');
        
        if (existingToken) {
          logger.log('[AuthGuard] Найден существующий токен, проверяем валидность...');
          
          // Проверяем валидность токена через auth-validate
          try {
            const validateResponse = await fetch(getApiUrl(API_CONFIG.endpoints.authValidate), {
              method: 'POST',
              headers: getDefaultHeaders(),
              credentials: 'omit', // Не используем cookie, только Bearer token
            });
            
            if (validateResponse.ok) {
              const validateData = await validateResponse.json();
              
              // Токен валиден, обновляем user context из ответа
              if (validateData.success && validateData.data?.user) {
                const userContext = {
                  userId: validateData.data.user.id,
                  role: validateData.data.role || null,
                  companyId: validateData.data.companyId || null,
                  username: validateData.data.user.username,
                  firstName: validateData.data.user.first_name,
                };
                localStorage.setItem('user_context', JSON.stringify(userContext));
                logger.log('[AuthGuard] Токен валиден, user context обновлен:', userContext);
              }
              
              setIsAuthReady(true);
              return;
            } else {
              // Токен невалиден (401/403), удаляем его и продолжаем с auth-init
              logger.warn('[AuthGuard] Токен невалиден, удаляем и продолжаем с auth-init');
              localStorage.removeItem('session_token');
              localStorage.removeItem('user_context');
              // Продолжаем выполнение - переходим к auth-init
            }
          } catch (error) {
            // Ошибка при проверке токена (network error), удаляем токен и продолжаем с auth-init
            logger.warn('[AuthGuard] Ошибка при проверке токена, удаляем и продолжаем с auth-init:', error);
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_context');
            // Продолжаем выполнение - переходим к auth-init
          }
        }

        // Проверяем наличие Telegram initData
        if (!window.Telegram?.WebApp?.initData) {
          logger.warn('[AuthGuard] Нет Telegram initData, пропускаем авторизацию');
          setAuthError('Telegram initData not available');
          setIsAuthReady(true);
          return;
        }

        logger.log('[AuthGuard] Инициализация сессии через auth-init...');

        // Вызываем auth-init для получения session_token
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
          credentials: 'omit', // Не используем cookie, только Bearer token
        });

        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `HTTP ${response.status}`;
          }
          logger.error('[AuthGuard] Auth init failed:', response.status, errorText);
          setAuthError(`Auth failed: ${response.status}`);
          setIsAuthReady(true);
          return;
        }

        // Читаем JSON напрямую (response.json() можно вызвать только один раз)
        let data: any;
        try {
          data = await response.json();
          console.log('[AuthGuard] 📦 Parsed response:', JSON.stringify(data, null, 2));
        } catch (e) {
          logger.error('[AuthGuard] Failed to parse response as JSON:', e);
          setAuthError('Invalid JSON response');
          setIsAuthReady(true);
          return;
        }
        
        // Извлекаем токен из разных возможных мест в ответе (через any для гибкости)
        let token: string | undefined = 
          data?.token || 
          data?.access_token || 
          data?.data?.session_token || 
          data?.data?.token;
        
        if (data.success && token) {
          // Сохраняем session_token
          console.log('[AuthGuard] 🔑 Token from response:', token ? token.substring(0, 20) + '...' : 'MISSING');
          console.log('[AuthGuard] 🔑 Full token length:', token ? token.length : 0);
          
          // Очищаем старый токен перед сохранением нового
          localStorage.removeItem('session_token');
          
          // Сохраняем новый токен
          localStorage.setItem('session_token', token);
          console.log('[AuthGuard] ✅ Session token saved to localStorage');
          
          // Проверяем сразу после сохранения
          const savedToken = localStorage.getItem('session_token');
          console.log('[AuthGuard] 🔍 Verifying token in localStorage:', savedToken ? `✅ Found (${savedToken.length} chars)` : '❌ NOT FOUND');
          console.log('[AuthGuard] 🔍 Token match:', savedToken === token ? '✅ YES' : '❌ NO');
          
          if (savedToken !== token) {
            console.error('[AuthGuard] ❌ CRITICAL: Token mismatch!');
            console.error('[AuthGuard] Saved:', savedToken?.substring(0, 30));
            console.error('[AuthGuard] Expected:', token.substring(0, 30));
          }
          
          // Дополнительная проверка - пробуем прочитать через getDefaultHeaders
          const testHeaders = getDefaultHeaders();
          console.log('[AuthGuard] 🔍 Test getDefaultHeaders():', testHeaders.Authorization ? '✅ Has Authorization' : '❌ No Authorization');
          if (testHeaders.Authorization) {
            console.log('[AuthGuard] 🔍 Authorization header:', testHeaders.Authorization.substring(0, 30) + '...');
          }
          
          // Сохраняем user context
          if (data.data.user) {
            const userContext = {
              userId: data.data.user.id,
              role: data.data.role || null,
              companyId: data.data.companyId || null,
              username: data.data.user.username,
              firstName: data.data.user.first_name,
            };
            localStorage.setItem('user_context', JSON.stringify(userContext));
            logger.log('[AuthGuard] Авторизация успешна:', userContext);
            console.log('[AuthGuard] ✅ User context saved:', userContext);
          }
          
          setIsAuthReady(true);
        } else {
          logger.error('[AuthGuard] Invalid auth response - no token found:', data);
          setAuthError('Invalid auth response: no token found');
          setIsAuthReady(true);
        }
      } catch (error) {
        logger.error('[AuthGuard] Auth init error:', error);
        setAuthError(error instanceof Error ? error.message : 'Auth init failed');
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  // Показываем splash screen пока идет авторизация
  if (!isAuthReady) {
    return (
      <ModernSplashScreen>
        <div />
      </ModernSplashScreen>
    );
  }

  // Если была ошибка авторизации, все равно показываем приложение
  // (API будет обрабатывать 401/403 автоматически через reAuth)
  if (authError) {
    logger.warn('[AuthGuard] Продолжаем работу с ошибкой авторизации:', authError);
  }

  return <>{children}</>;
};

