import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'
import { logger } from './lib/logger'

// Инициализация темы: по умолчанию используем системную
const initializeTheme = () => {
  // Telegram Mini App интеграция: если доступно, используем colorScheme
  const tg = window.Telegram?.WebApp;
  if (tg) {
    const applyFromTelegram = () => {
      const themeParams = tg.themeParams || {};
      const bg = themeParams.bg_color || '#ffffff';
      const text = themeParams.text_color || '#000000';
      const hint = themeParams.hint_color || '#e5e5e5';
      const secondaryBg = themeParams.secondary_bg_color || '#f8f9fa';
      const button = themeParams.button_color || '#2481cc';
      const buttonText = themeParams.button_text_color || '#ffffff';
      const root = document.documentElement;
      root.style.setProperty('--bg-primary', bg);
      root.style.setProperty('--bg-secondary', secondaryBg);
      root.style.setProperty('--text-primary', text);
      root.style.setProperty('--text-secondary', hint);
      root.style.setProperty('--gradient-from', bg);
      root.style.setProperty('--gradient-via', secondaryBg);
      root.style.setProperty('--gradient-to', bg);
      root.style.setProperty('--tg-button', button);
      root.style.setProperty('--tg-button-text', buttonText);
      const isDark = tg.colorScheme === 'dark';
      root.classList.toggle('dark', isDark);
    };
    applyFromTelegram();
    try {
      tg.onEvent?.('themeChanged', applyFromTelegram);
    } catch {
      // Ignore if onEvent is not available
    }
  }

  const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = saved && saved !== 'system' ? saved : (preferDark ? 'dark' : 'light');
  const root = document.documentElement;

  if (effective === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');

  // Если выбрана системная тема или тема не сохранена — слушаем изменения системы
  if (!saved || saved === 'system') {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      if (media.matches) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    if ('addEventListener' in media) {
      media.addEventListener('change', apply);
    } else {
      // @ts-expect-error - Legacy Safari API
      media.addListener(apply);
    }
  }
};

// Инициализируем тему до рендера
initializeTheme();

logger.log('[Main] Инициализация приложения, проверка Telegram SDK...');
const tgCheck = window.Telegram?.WebApp;
logger.log('[Main] Telegram SDK при загрузке:', { 
  exists: !!tgCheck, 
  hasReady: typeof tgCheck?.ready === 'function',
  hasExpand: typeof tgCheck?.expand === 'function',
  version: tgCheck?.version || 'неизвестно',
  platform: tgCheck?.platform || 'неизвестно'
});

// Проверяем наличие Telegram SDK ПЕРЕД рендером React
logger.log('[Bootstrap] Проверка перед рендером React...');
const preRenderCheck = () => {
  const tgPre = window.Telegram?.WebApp;
  if (tgPre) {
    logger.log('[Bootstrap] ✅ Telegram SDK обнаружен ДО рендера React:', {
      version: tgPre.version,
      platform: tgPre.platform,
      hasInitData: !!tgPre.initData
    });
  } else {
    logger.warn('[Bootstrap] ⚠️ Telegram SDK НЕ обнаружен ДО рендера React');
  }
};
preRenderCheck();

// Инициализация Eruda (мобильный DevTools)
// ВРЕМЕННО: Включено для production во время разработки приложения
// TODO: Отключить для production когда появятся реальные клиенты
const shouldLoadEruda = true; // import.meta.env.DEV || localStorage.getItem('eruda_enabled') === 'true';

if (shouldLoadEruda) {
  import('eruda').then((module) => {
    const eruda = module.default;
    
    // Инициализация с настройками (без shadow DOM для совместимости с React)
    eruda.init({
      container: document.body,
      tool: ['console', 'network', 'resources', 'info'], // Убрали elements и sources
      useShadowDom: false, // Отключили shadow DOM для совместимости с React
      autoScale: true,
      defaults: {
        displaySize: 50,
        transparency: 0.9,
        theme: 'Dracula',
      }
    });
    
    // Настройка позиции кнопки вызова (справа по центру)
    eruda.position({ x: window.innerWidth - 50, y: window.innerHeight / 2 });
    
    // Скрываем панель по умолчанию, показываем только кнопку
    eruda.hide();
    
    logger.log('[Eruda] Initialized in production mode');
  }).catch((err) => {
    logger.error('[Eruda] Failed to load:', err);
  });
}



// Telegram Web App: запрос fullscreen режима
const tgForFullscreen = window.Telegram?.WebApp;
if (tgForFullscreen && typeof tgForFullscreen.requestFullscreen === 'function') {
  try {
    tgForFullscreen.requestFullscreen();
    logger.log('[Telegram] Fullscreen mode requested');
  } catch (error) {
    logger.warn('[Telegram] Failed to request fullscreen:', error);
  }
}



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      expand={true}
      richColors
      closeButton
      theme="system"
    />
  </React.StrictMode>,
)