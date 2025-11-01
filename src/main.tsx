import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Инициализация темы: по умолчанию используем системную
const initializeTheme = () => {
  // Telegram Mini App интеграция: если доступно, используем colorScheme
  const tg = (window as any).Telegram?.WebApp;
  if (tg) {
    const applyFromTelegram = () => {
      const params = tg.initDataUnsafe?.theme_params || tg.themeParams || {};
      const bg = params.bg_color || '#ffffff';
      const text = params.text_color || '#000000';
      const hint = params.hint_color || '#e5e5e5';
      const secondaryBg = params.secondary_bg_color || '#f8f9fa';
      const button = params.button_color || '#2481cc';
      const buttonText = params.button_text_color || '#ffffff';
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
    } catch (_) {}
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
    try {
      media.addEventListener('change', apply);
    } catch (_) {
      // Safari
      // @ts-ignore
      media.addListener(apply);
    }
  }
};

// Инициализируем тему до рендера
initializeTheme();

console.log('[Main] Инициализация приложения, проверка Telegram SDK...');
const tgCheck = (window as any)?.Telegram?.WebApp;
console.log('[Main] Telegram SDK при загрузке:', { 
  exists: !!tgCheck, 
  hasReady: typeof tgCheck?.ready === 'function',
  hasExpand: typeof tgCheck?.expand === 'function',
  version: tgCheck?.version || 'неизвестно',
  platform: tgCheck?.platform || 'неизвестно'
});

// Проверяем наличие Telegram SDK ПЕРЕД рендером React
console.log('[Bootstrap] Проверка перед рендером React...');
const preRenderCheck = () => {
  const tgPre = (window as any)?.Telegram?.WebApp;
  if (tgPre) {
    console.log('[Bootstrap] ✅ Telegram SDK обнаружен ДО рендера React:', {
      version: tgPre.version,
      platform: tgPre.platform,
      hasInitData: !!tgPre.initData
    });
  } else {
    console.warn('[Bootstrap] ⚠️ Telegram SDK НЕ обнаружен ДО рендера React');
  }
};
preRenderCheck();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)