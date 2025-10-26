import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';

// Lazy loading компонентов для лучшей производительности
const MenuPage = lazy(() => import('../front/MenuPage'));
const VoiceAssistantPage = lazy(() => import('../front/VoiceAssistantPage'));

// Fallback компонент для Suspense
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center animate-pulse">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-gray-600 dark:text-gray-300">Загрузка Lumon Platform...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <SplashScreen>
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<MenuPage />} />
              <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </SplashScreen>
  );
};

export default App;