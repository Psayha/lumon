import React, { useEffect, useState } from 'react';
import { API_CONFIG, getApiUrl } from '../config/api';
import { ModernSplashScreen } from './ModernSplashScreen';

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
          console.log('[AuthGuard] Найден существующий токен, используем его');
          setIsAuthReady(true);
          return;
        }

        // Проверяем наличие Telegram initData
        if (!window.Telegram?.WebApp?.initData) {
          console.warn('[AuthGuard] Нет Telegram initData, пропускаем авторизацию');
          setAuthError('Telegram initData not available');
          setIsAuthReady(true);
          return;
        }

        console.log('[AuthGuard] Инициализация сессии через auth-init...');

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
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AuthGuard] Auth init failed:', response.status, errorText);
          setAuthError(`Auth failed: ${response.status}`);
          setIsAuthReady(true);
          return;
        }

        const data = await response.json();
        
        if (data.success && data.data?.session_token) {
          // Сохраняем session_token
          localStorage.setItem('session_token', data.data.session_token);
          
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
            console.log('[AuthGuard] Авторизация успешна:', userContext);
          }
          
          setIsAuthReady(true);
        } else {
          console.error('[AuthGuard] Invalid auth response:', data);
          setAuthError('Invalid auth response');
          setIsAuthReady(true);
        }
      } catch (error) {
        console.error('[AuthGuard] Auth init error:', error);
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
    console.warn('[AuthGuard] Продолжаем работу с ошибкой авторизации:', authError);
  }

  return <>{children}</>;
};

