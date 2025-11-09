import { useEffect, useState } from 'react';
import { logger } from '../lib/logger';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  initData?: string;
  initDataUnsafe?: any;
  platform?: string;
  version?: string;
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  MainButton?: {
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

/**
 * Проверяет, запущено ли приложение в Telegram Mini App
 * СТРОГАЯ ПРОВЕРКА: требует обязательное наличие initData для безопасности
 */
export const isTelegramWebApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) {
    logger.log('[isTelegramWebApp] Telegram SDK не найден');
    return false;
  }

  const platform = tg.platform;
  const hasInitData = !!tg.initData && tg.initData.trim().length > 0;
  
  // КРИТИЧЕСКИ ВАЖНО: без initData это НЕ Telegram Mini App
  // initData - это обязательный параметр, который передаётся только в настоящем Telegram Mini App
  if (!hasInitData) {
    logger.log('[isTelegramWebApp] initData отсутствует - это НЕ Telegram Mini App');
    logger.log('[isTelegramWebApp] Причина: initData обязателен для настоящего Telegram Mini App');
    return false;
  }

  // Дополнительная проверка: валидная платформа (не web, не unknown)
  const validTelegramPlatforms = ['android', 'ios', 'macos', 'windows', 'linux', 'tdesktop', 'webk', 'weba', 'unix'];
  const hasValidPlatform = platform && validTelegramPlatforms.includes(platform.toLowerCase());
  
  // Если platform = 'web' или пустая/undefined - даже с initData это подозрительно
  if (!platform || platform === 'web' || platform === 'unknown' || platform === '') {
    logger.warn('[isTelegramWebApp] Платформа не валидна для Telegram Mini App:', platform, 'но initData присутствует');
    // ВАЖНО: даже если платформа странная, но есть initData - считаем это Telegram
    // (может быть какой-то редкий случай)
    return true;
  }
  
  // Финальная проверка: есть initData И валидная платформа = точно Telegram
  const result = hasInitData && hasValidPlatform;
  
  logger.log('[isTelegramWebApp] Проверка:', {
    hasSDK: !!tg,
    hasInitData,
    initDataLength: tg.initData?.length || 0,
    platform: platform || 'неизвестно',
    hasValidPlatform,
    result
  });
  
  return result;
};

export const useTelegram = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем, не инициализирован ли уже Telegram (защита от двойного вызова в StrictMode)
    if (isReady && tg) {
      logger.log('[Telegram] useTelegram: уже инициализирован, пропускаем');
      return;
    }
    
    logger.log('[Telegram] useTelegram: хук вызван, проверка SDK...');
    
    // Функция инициализации Telegram
    const initializeTelegram = (webApp: TelegramWebApp) => {
      logger.log('[Telegram] initializeTelegram: начало инициализации');
      
      // Сохраняем initData в localStorage при первом запуске (на случай Refresh)
      if (webApp.initData) {
        const savedInitData = localStorage.getItem('tg_initData');
        if (!savedInitData || savedInitData !== webApp.initData) {
          localStorage.setItem('tg_initData', webApp.initData);
          logger.log('[Telegram] initData сохранён в localStorage');
        }
      } else {
        // Пытаемся восстановить из localStorage при Refresh
        const savedInitData = localStorage.getItem('tg_initData');
        if (savedInitData) {
          logger.log('[Telegram] initData восстановлен из localStorage');
        }
      }

      // Логирование для отладки - ВСЕГДА выводим
      const isTelegram = isTelegramWebApp();
      const debugInfo = {
        hasSDK: !!webApp,
        hasInitData: !!webApp.initData,
        platform: webApp.platform || 'неизвестно',
        version: webApp.version || 'неизвестно',
        isTelegramMiniApp: isTelegram,
        initDataLength: webApp.initData?.length || 0,
        colorScheme: webApp.colorScheme || 'неизвестно',
        hasBackButton: !!webApp.BackButton,
        hasMainButton: !!webApp.MainButton,
        urlHash: window.location.hash?.substring(0, 100) || 'нет',
        fullUrl: window.location.href?.substring(0, 150) || 'нет'
      };
      
      logger.log('[Telegram] SDK загружен:', debugInfo);
      
      // Предупреждение если initData пустой, но SDK доступен
      if (!webApp.initData && isTelegram) {
        logger.warn('[Telegram] initData отсутствует, но SDK доступен. Возможные причины:');
        logger.warn('  - Открыто не через Telegram Mini App (прямая ссылка в браузере)');
        logger.warn('  - Страница была обновлена (Refresh) - проверьте localStorage');
        logger.warn('  - Проблема с маршрутизацией (hash в URL)');
        const savedInitData = localStorage.getItem('tg_initData');
        if (savedInitData) {
          logger.info('[Telegram] Найден сохранённый initData в localStorage:', savedInitData.substring(0, 50) + '...');
        }
      }

      setTg(webApp);
      try {
        webApp.ready();
        webApp.expand?.();
        logger.log('[Telegram] SDK инициализирован (ready + expand вызваны)');
      } catch (error) {
        logger.warn('[Telegram] Ошибка при инициализации:', error);
      } finally {
        setIsReady(true);
        logger.log('[Telegram] isReady установлен в true');
      }
    };

    // Проверяем наличие Telegram SDK
    const webApp = (window as any)?.Telegram?.WebApp as TelegramWebApp | undefined;
    
    if (webApp) {
      // SDK доступен сразу
      logger.log('[Telegram] SDK найден сразу, инициализация...');
      initializeTelegram(webApp);
    } else {
      // Если SDK не загружен сразу, пробуем подождать немного (для асинхронной загрузки)
      logger.log('[Telegram] SDK не найден, ожидание загрузки...');
      let attempts = 0;
      const maxAttempts = 50; // Максимум 5 секунд
      
      const checkTelegram = () => {
        const delayedWebApp = (window as any)?.Telegram?.WebApp as TelegramWebApp | undefined;
        if (delayedWebApp) {
          logger.log(`[Telegram] SDK найден после ${attempts} попыток, инициализация...`);
          initializeTelegram(delayedWebApp);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkTelegram, 100);
        } else {
          logger.warn('[Telegram] SDK не загружен после ожидания (50 попыток)');
          setIsReady(true); // Устанавливаем isReady даже если SDK не найден
        }
      };
      checkTelegram();
    }
  }, []);

  return { tg, isReady } as const;
};








