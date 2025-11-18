import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModernSplashScreen } from './components/ModernSplashScreen';
import { AuthGuard } from './components/AuthGuard';
import { PageGuard } from './components/PageGuard';
import { useTelegram, isTelegramWebApp } from './hooks/useTelegram';
import { logger } from './lib/logger';
import DebugLogger from './components/DebugLogger';

// Lazy loading компонентов для лучшей производительности
const MenuPage = lazy(() => import('../front/MenuPage'));
const VoiceAssistantPage = lazy(() => import('../front/VoiceAssistantPage'));
const CRMPage = lazy(() => import('../front/CRMPage'));
const AnalyticsPage = lazy(() => import('../front/AnalyticsPage'));
const KnowledgeBasePage = lazy(() => import('../front/KnowledgeBasePage'));
const PricingPage = lazy(() => import('../front/PricingPage'));
const ApiTestPage = lazy(() => import('../front/ApiTestPage'));

// Fallback компонент для Suspense
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
    {/* Современный анимированный фон */}
    <div className="absolute inset-0">
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-400/30 to-purple-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      />
    </div>

    <div className="relative z-10 text-center max-w-md mx-auto px-6">
      {/* Современный логотип */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-28 h-28 mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-white/30 dark:border-slate-700/50 flex items-center justify-center relative overflow-hidden">
          {/* Анимированный градиентный фон */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(147, 51, 234, 0.15) 100%)",
                "linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(99, 102, 241, 0.15) 100%)",
                "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)"
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Свечение вокруг иконки */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-3xl"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Иконка с плавным вращением */}
          <motion.div
            className="relative z-10"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{
              rotate: {
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <Brain className="w-14 h-14 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </motion.div>

          {/* Декоративные элементы */}
          <motion.div
            className="absolute -top-2 -right-2 z-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
          </motion.div>

          <motion.div
            className="absolute -bottom-1 -left-1 z-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.9, 0.5],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Название с градиентом */}
      <motion.h2
        className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
      >
        Lumon
      </motion.h2>
      
      <motion.p
        className="text-lg text-slate-600 dark:text-slate-400 mb-8 font-medium tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Загрузка страницы...
      </motion.p>

      {/* Современный индикатор загрузки (пульсирующие точки) */}
      <motion.div
        className="flex justify-center items-center space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full shadow-lg"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </div>
  </div>
);

const App: React.FC = () => {
  logger.log('[App] Компонент App монтируется');
  
  // Проверяем, запущено ли приложение через Telegram
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);

  useEffect(() => {
    // Даём время для загрузки Telegram SDK, если он есть
    let attempts = 0;
    const maxAttempts = 15; // 15 попыток = 3 секунды (увеличено для надежности)
    let positiveResults = 0; // Счетчик положительных результатов
    const requiredPositiveChecks = 3; // Требуем минимум 3 положительных проверки подряд
    
    const checkTelegram = () => {
      attempts++;
      const result = isTelegramWebApp();
      logger.log(`[App] Проверка Telegram (попытка ${attempts}):`, result);
      
      if (result) {
        positiveResults++;
        // Требуем несколько положительных проверок подряд для надежности
        if (positiveResults >= requiredPositiveChecks) {
          logger.log(`[App] Telegram подтвержден (${positiveResults} проверок подряд), показываем приложение`);
          setIsTelegram(true);
          return;
        }
        // Продолжаем проверку даже после положительного результата
        setTimeout(checkTelegram, 200);
        return;
      } else {
        // Если проверка вернула false, сбрасываем счетчик положительных
        positiveResults = 0;
      }
      
      // Если это последняя попытка или прошло достаточно времени
      if (attempts >= maxAttempts) {
        logger.log('[App] Telegram не обнаружен после всех попыток, показываем страницу "Только для Telegram"');
        logger.log('[App] Итоги проверки:', {
          attempts,
          positiveResults,
          requiredPositiveChecks
        });
        setIsTelegram(false);
        return;
      }
      
      // Продолжаем проверку
      setTimeout(checkTelegram, 200);
    };

    // Начинаем проверку
    checkTelegram();
  }, []);

  // Если не Telegram и проверка завершена - показываем страницу "Только для Telegram"
  // ЗАКОММЕНТИРОВАНО: разрешаем открывать приложение через браузер
  // if (isTelegram === false) {
  //   return <TelegramOnlyPage />;
  // }

  // Если проверка ещё не завершена - показываем только ModernSplashScreen (без дублирования экранов)
  if (isTelegram === null) {
    return (
      <ModernSplashScreen>
        <div />
      </ModernSplashScreen>
    );
  }
  
  const TelegramUIManager: React.FC = () => {
    logger.log('[App] TelegramUIManager монтируется');
    const location = useLocation();
    const navigate = useNavigate();
    const { tg, isReady } = useTelegram();

    // Автопродление сессии каждые 4 минуты
    useEffect(() => {
      const refreshInterval = setInterval(async () => {
        const token = localStorage.getItem('session_token');
        if (!token) return;

        try {
          const response = await fetch('/webhook/auth-refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ token })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.session_token) {
              localStorage.setItem('session_token', data.data.session_token);
              logger.log('[App] Session refreshed successfully');
            }
          }
        } catch (error) {
          logger.warn('[App] Session refresh failed:', error);
        }
      }, 4 * 60 * 1000); // 4 минуты

      return () => clearInterval(refreshInterval);
    }, []);

    // Применяем тему Telegram к CSS-переменным и классу dark
    useEffect(() => {
      if (!isReady || !tg) return;
      const params = (tg as any).initDataUnsafe?.theme_params || (tg as any).themeParams || {};
      const bg = params.bg_color || '#ffffff';
      const text = params.text_color || '#000000';
      const hint = params.hint_color || '#e5e5e5';
      const secondaryBg = params.secondary_bg_color || '#f8f9fa';
      const button = params.button_color || '#2481cc';
      const buttonText = params.button_text_color || '#ffffff';

      try {
        // Эти методы могут быть не доступны в старых версиях API (например, 6.0)
        if (tg.setHeaderColor) {
          tg.setHeaderColor(bg);
        }
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor(bg);
        }
        // Сентябрь 2024+: нижняя панель
        if ((tg as any).setBottomBarColor) {
          (tg as any).setBottomBarColor(bg);
        }
      } catch (_error) {
        // Тихая обработка - методы могут быть не поддерживаемы в старых версиях
        logger.debug('[Telegram] Некоторые методы UI не поддерживаются в текущей версии API');
      }

      const root = document.documentElement;
      root.style.setProperty('--bg-primary', bg);
      root.style.setProperty('--bg-secondary', secondaryBg);
      root.style.setProperty('--text-primary', text);
      root.style.setProperty('--text-secondary', hint);
      // для градиента используем оттенки темы
      root.style.setProperty('--gradient-from', bg);
      root.style.setProperty('--gradient-via', secondaryBg);
      root.style.setProperty('--gradient-to', bg);
      // кнопки (могут использоваться в компонентах)
      root.style.setProperty('--tg-button', button);
      root.style.setProperty('--tg-button-text', buttonText);

      // Переключаем dark-класс согласно Telegram colorScheme
      const isDark = (tg as any).colorScheme === 'dark';
      root.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
    }, [isReady, tg]);

    // Подписка на изменения темы (WebApp.onEvent('themeChanged'))
    useEffect(() => {
      if (!isReady || !tg || !(tg as any).onEvent) return;
      const onThemeChanged = () => {
        // Тригерим эффект применения темы, изменив зависимость через no-op
        // Здесь достаточно форснуть re-render сменой location.key, но проще напрямую запустить установку стилей
        const params = (tg as any).initDataUnsafe?.theme_params || (tg as any).themeParams || {};
        const bg = params.bg_color || '#ffffff';
        const text = params.text_color || '#000000';
        const hint = params.hint_color || '#e5e5e5';
        const secondaryBg = params.secondary_bg_color || '#f8f9fa';
        const button = params.button_color || '#2481cc';
        const buttonText = params.button_text_color || '#ffffff';
        try {
          // Эти методы могут быть не доступны в старых версиях API (например, 6.0)
          if (tg.setHeaderColor) {
            tg.setHeaderColor(bg);
          }
          if (tg.setBackgroundColor) {
            tg.setBackgroundColor(bg);
          }
          if ((tg as any).setBottomBarColor) {
            (tg as any).setBottomBarColor(bg);
          }
        } catch (_error) {
          // Тихая обработка - методы могут быть не поддерживаемы в старых версиях
          console.debug('[Telegram] Некоторые методы UI не поддерживаются в текущей версии API');
        }
        const root = document.documentElement;
        root.style.setProperty('--bg-primary', bg);
        root.style.setProperty('--bg-secondary', secondaryBg);
        root.style.setProperty('--text-primary', text);
        root.style.setProperty('--text-secondary', hint);
        root.style.setProperty('--gradient-from', bg);
        root.style.setProperty('--gradient-via', secondaryBg);
        root.style.setProperty('--gradient-to', bg);
        root.style.setProperty('--tg-button', button);
        root.style.setProperty('--tg-button-text', buttonText);
        const isDark = (tg as any).colorScheme === 'dark';
        root.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
      };
      (tg as any).onEvent('themeChanged', onThemeChanged);
      return () => {
        (tg as any).offEvent?.('themeChanged', onThemeChanged);
      };
    }, [isReady, tg]);

    // Логика Back/Close: на главной скрываем Back, на внутренних показываем и возвращаемся назад
    useEffect(() => {
      if (!isReady || !tg) return;
      
      // Проверяем наличие BackButton (не поддерживается в версиях API < 6.1)
      if (!tg.BackButton) {
        console.warn('[Telegram] BackButton не поддерживается в текущей версии API');
        return;
      }

      const isRoot = location.pathname === '/';
      
      if (isRoot) {
        // На главной странице скрываем BackButton - системная кнопка закрыть будет закрывать приложение
        try {
          tg.BackButton.hide();
        } catch (error) {
          console.warn('[Telegram] Ошибка при скрытии BackButton:', error);
        }
        return;
      }

      // На внутренних страницах показываем BackButton - системная кнопка закрыть будет работать как "назад"
      try {
        tg.BackButton.show();
        
        // Настраиваем обработчик: при нажатии на системную кнопку закрыть возвращаемся назад в истории
        tg.BackButton.onClick(() => {
          const historyLength = window.history.length;
          if (historyLength > 1) {
            navigate(-1);
          } else {
            // Если нет истории, переходим на главную
            navigate('/');
          }
        });
      } catch (error) {
        console.warn('[Telegram] Ошибка при работе с BackButton:', error);
      }
    }, [isReady, tg, location.pathname, navigate]);

    // Слушаем safe-area Telegram и маппим в CSS переменные
    useEffect(() => {
      if (!isReady || !tg) return;
      const applySafeArea = () => {
        const inset = (tg as any).safeAreaInset || (tg as any).contentSafeAreaInset;
        if (!inset) return;
        const root = document.documentElement;
        if (inset.top != null) root.style.setProperty('--safe-top', `${inset.top}px`);
        if (inset.right != null) root.style.setProperty('--safe-right', `${inset.right}px`);
        if (inset.bottom != null) root.style.setProperty('--safe-bottom', `${inset.bottom}px`);
        if (inset.left != null) root.style.setProperty('--safe-left', `${inset.left}px`);
      };
      applySafeArea();
      (tg as any).onEvent?.('safeAreaChanged', applySafeArea);
      (tg as any).onEvent?.('contentSafeAreaChanged', applySafeArea);
      return () => {
        (tg as any).offEvent?.('safeAreaChanged', applySafeArea);
        (tg as any).offEvent?.('contentSafeAreaChanged', applySafeArea);
      };
    }, [isReady, tg]);

    return null;
  };

  return (
    <ModernSplashScreen>
      <div className="min-h-screen safe-area-inset gradient-bg">
        <ErrorBoundary>
          <Router>
            <TelegramUIManager />
            <AuthGuard>
            <Suspense fallback={<LoadingFallback />}>
              <div className="app-content">
                <Routes>
                  <Route path="/" element={<MenuPage />} />
                  <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
                    <Route
                      path="/app/crm"
                      element={
                        <PageGuard blockViewer={false}>
                          <CRMPage />
                        </PageGuard>
                      }
                    />
                    <Route
                      path="/app/analytics"
                      element={
                        <PageGuard blockViewer={false}>
                          <AnalyticsPage />
                        </PageGuard>
                      }
                    />
                    <Route
                      path="/app/knowledge"
                      element={
                        <PageGuard blockViewer={false}>
                          <KnowledgeBasePage />
                        </PageGuard>
                      }
                    />
                  <Route path="/app/payment" element={<PricingPage />} />
                  <Route path="/api-test" element={<ApiTestPage />} />
                </Routes>
              </div>
            </Suspense>
            </AuthGuard>
          </Router>
        </ErrorBoundary>
        {/* Debug Logger - показываем всегда для отладки */}
        <DebugLogger />
      </div>
    </ModernSplashScreen>
  );
};

export default App;