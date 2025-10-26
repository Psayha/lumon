import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  children: React.ReactNode;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Показываем загрузочный экран 2 секунды
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          {/* Логотип/иконка */}
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative">
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ripple opacity-60"></div>
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ripple-delay-1 opacity-40"></div>
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ripple-delay-2 opacity-20"></div>
            <svg className="w-10 h-10 text-white relative z-10 animate-precise-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          {/* Название */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in">
            Lumon Platform
          </h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
