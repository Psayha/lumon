import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';

export const SimpleThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = React.useState(() => {
    // Проверяем, есть ли класс 'dark' в html элементе
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    console.log('SimpleThemeToggle: toggleTheme called, current isDark:', isDark);
    
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    // Применяем тему к документу
    const root = document.documentElement;
    if (newIsDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    console.log('SimpleThemeToggle: theme changed to', newIsDark ? 'dark' : 'light');
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center space-x-2"
      aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {isDark ? 'Светлая тема' : 'Темная тема'}
      </span>
    </Button>
  );
};
