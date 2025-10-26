import React from 'react';
import { Sun, Moon, Brain } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [showSplash, setShowSplash] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative">
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ripple opacity-60"></div>
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ripple-delay-1 opacity-40"></div>
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ripple-delay-2 opacity-20"></div>
            <Brain className="w-10 h-10 text-white relative z-10 animate-precise-pulse" />
          </div>
          <button
            onClick={() => setShowSplash(false)}
            className="mt-8 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleTheme}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg font-medium
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${theme === 'light'
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
            : 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg'
          }
        `}
        aria-label={`Переключить на ${theme === 'light' ? 'темную' : 'светлую'} тему`}
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={() => setShowSplash(true)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Показать загрузочный экран"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};