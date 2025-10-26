import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    // Инициализируем resolvedTheme на основе сохраненной темы
    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme === 'dark') return 'dark';
    if (savedTheme === 'light') return 'light';
    
    // system theme
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Определяем реальную тему на основе системных настроек
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Обновляем resolvedTheme при изменении theme
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme, getSystemTheme]);

  // Слушаем изменения системной темы
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setResolvedTheme(getSystemTheme());
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, getSystemTheme]);

  // Применяем тему к документу
  useEffect(() => {
    const root = window.document.documentElement;
    
    console.log('Applying theme to document:', { theme, resolvedTheme });
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme, theme]);

  const toggleTheme = useCallback(() => {
    console.log('toggleTheme called, current theme:', theme);
    setTheme(prev => {
      const newTheme = (() => {
        switch (prev) {
          case 'light':
            return 'dark';
          case 'dark':
            return 'system';
          case 'system':
            return 'light';
          default:
            return 'light';
        }
      })();
      console.log('Theme changed from', prev, 'to', newTheme);
      return newTheme;
    });
  }, [setTheme, theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  };
};
