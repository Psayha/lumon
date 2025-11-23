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

        // Проверяем наличие Telegram initData (проверяем и на undefined/null, и на пустую строку)
        const initData = window.Telegram?.WebApp?.initData;
        if (!initData || initData.trim() === '') {
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
            initData: initData,
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
        } catch (e) {
          logger.error('[AuthGuard] Failed to parse response as JSON:', e);
          setAuthError('Invalid JSON response');
          setIsAuthReady(true);
          return;
        }
        
        // Извлекаем токен из ответа (с fallback для разных структур)
        const token: string | undefined = 
          data?.data?.session_token || 
          data?.data?.token || 
          data?.token || 
          data?.session_token;
        
        if (data.success && token) {
          // Сохраняем session_token
          localStorage.setItem('session_token', token);
          logger.log('[AuthGuard] ✅ Token saved to localStorage:', token.substring(0, 20) + '...');
          
          // Сохраняем user context
          if (data.data?.user) {
            const userContext = {
              userId: data.data.user.id,
              role: data.data.role || data.data.user.role || null,
              companyId: data.data.company_id || data.data.companyId || null,
              username: data.data.user.username || '',
              firstName: data.data.user.first_name || '',
            };
            localStorage.setItem('user_context', JSON.stringify(userContext));
            logger.log('[AuthGuard] Авторизация успешна:', userContext);
            logger.log('[AuthGuard] ✅ User context saved:', userContext);
          }
          
          setIsAuthReady(true);
        } else {
          logger.error('[AuthGuard] ❌ Invalid auth response - no token found:', {
            success: data.success,
            hasToken: !!token,
            dataKeys: Object.keys(data || {}),
            dataDataKeys: data?.data ? Object.keys(data.data) : []
          });
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

