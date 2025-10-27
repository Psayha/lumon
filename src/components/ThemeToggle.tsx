import React from 'react';
import { Sun, Moon, Brain } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

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

  const reloadApp = () => {
    window.location.reload();
  };

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
        onClick={reloadApp}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Перезагрузить приложение"
        title="Перезагрузить приложение"
      >
        <Brain className="w-4 h-4" />
      </button>
    </div>
  );
};