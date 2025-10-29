import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Инициализация темы: по умолчанию используем системную
const initializeTheme = () => {
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)