import { useEffect, useState } from 'react';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  initDataUnsafe?: any;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    showProgress?: () => void;
    hideProgress?: () => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
  };
}

export const useTelegram = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const webApp = (window as any)?.Telegram?.WebApp as TelegramWebApp | undefined;
    if (!webApp) return;

    setTg(webApp);
    try {
      webApp.ready();
      webApp.expand?.();
    } finally {
      setIsReady(true);
    }
  }, []);

  return { tg, isReady } as const;
};


