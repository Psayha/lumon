import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModernSplashScreen } from './components/ModernSplashScreen';

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
  return (
    <ModernSplashScreen>
      <div className="min-h-screen safe-area-inset bg-white dark:bg-gray-900">
        <ErrorBoundary>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
                <Route path="/app/crm" element={<CRMPage />} />
                <Route path="/app/analytics" element={<AnalyticsPage />} />
                <Route path="/app/knowledge" element={<KnowledgeBasePage />} />
                <Route path="/app/payment" element={<PricingPage />} />
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </div>
    </ModernSplashScreen>
  );
};

export default App;