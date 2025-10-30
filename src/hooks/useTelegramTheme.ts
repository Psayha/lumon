import { useEffect, useState } from 'react';

type ColorScheme = 'light' | 'dark';

interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export const useTelegramTheme = () => {
  const [themeParams, setThemeParams] = useState<ThemeParams>({});
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  useEffect(() => {
    const webApp = (window as any)?.Telegram?.WebApp;
    if (!webApp) return;

    const params = webApp?.initDataUnsafe?.theme_params || webApp?.themeParams || {};
    setThemeParams(params);

    const isDark = webApp?.colorScheme === 'dark';
    setColorScheme(isDark ? 'dark' : 'light');
    // Синхронизируем класс root для Tailwind dark mode
    document.documentElement.classList.toggle('dark', isDark);

    // Подписываемся на смену темы из Telegram
    const handleThemeChanged = () => {
      const nextIsDark = webApp?.colorScheme === 'dark';
      setColorScheme(nextIsDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', nextIsDark);
      const nextParams = webApp?.initDataUnsafe?.theme_params || webApp?.themeParams || {};
      setThemeParams(nextParams);
    };

    try {
      webApp.onEvent?.('themeChanged', handleThemeChanged);
    } catch (_) {
      // no-op
    }
  }, []);

  return { themeParams, colorScheme } as const;
};





