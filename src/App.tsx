import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModernSplashScreen } from './components/ModernSplashScreen';
import { useTelegram } from './hooks/useTelegram';
import { useTelegramTheme } from './hooks/useTelegramTheme';

// Lazy loading компонентов для лучшей производительности
const MenuPage = lazy(() => import('../front/MenuPage'));
const VoiceAssistantPage = lazy(() => import('../front/VoiceAssistantPage'));
const CRMPage = lazy(() => import('../front/CRMPage'));
const AnalyticsPage = lazy(() => import('../front/AnalyticsPage'));
const KnowledgeBasePage = lazy(() => import('../front/KnowledgeBasePage'));
const PricingPage = lazy(() => import('../front/PricingPage'));

// Fallback компонент для Suspense
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
    {/* Анимированный фон */}
    <div className="absolute inset-0">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <div className="relative z-10 text-center">
      {/* Логотип */}
      <div className="w-20 h-20 mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 flex items-center justify-center mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 animate-pulse" />
        <svg className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Название */}
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Lumon
      </h2>
      
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Загрузка страницы...
      </p>

      {/* Прогресс индикатор */}
      <div className="flex justify-center space-x-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const TelegramUIManager: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { tg, isReady } = useTelegram();
    const { themeParams } = useTelegramTheme();

    // Применяем тему Telegram к CSS-переменным и классу dark
    useEffect(() => {
      if (!isReady || !tg) return;
      const bg = themeParams.bg_color || '#ffffff';
      const text = themeParams.text_color || '#000000';
      const hint = themeParams.hint_color || '#e5e5e5';
      const secondaryBg = themeParams.secondary_bg_color || '#f8f9fa';
      const button = themeParams.button_color || '#2481cc';
      const buttonText = themeParams.button_text_color || '#ffffff';

      try {
        tg.setHeaderColor?.(bg);
        tg.setBackgroundColor?.(bg);
        // Сентябрь 2024+: нижняя панель
        (tg as any).setBottomBarColor?.(bg);
      } catch {}

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
    }, [isReady, tg, themeParams.bg_color, themeParams.text_color, themeParams.hint_color, themeParams.secondary_bg_color, themeParams.button_color, themeParams.button_text_color]);

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
          tg.setHeaderColor?.(bg);
          tg.setBackgroundColor?.(bg);
          (tg as any).setBottomBarColor?.(bg);
        } catch {}
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
      };
      (tg as any).onEvent('themeChanged', onThemeChanged);
      return () => {
        (tg as any).offEvent?.('themeChanged', onThemeChanged);
      };
    }, [isReady, tg]);

    // Логика Back/Close: на главной скрываем Back, на внутренних показываем и возвращаемся назад
    useEffect(() => {
      if (!isReady || !tg) return;
      const isRoot = location.pathname === '/';
      if (isRoot) {
        tg.BackButton.hide();
        return;
      }

      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate(-1);
      });
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
            <Suspense fallback={<LoadingFallback />}>
              <div className="app-content">
                <Routes>
                  <Route path="/" element={<MenuPage />} />
                  <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
                  <Route path="/app/crm" element={<CRMPage />} />
                  <Route path="/app/analytics" element={<AnalyticsPage />} />
                  <Route path="/app/knowledge" element={<KnowledgeBasePage />} />
                  <Route path="/app/payment" element={<PricingPage />} />
                </Routes>
              </div>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </div>
    </ModernSplashScreen>
  );
};

export default App;