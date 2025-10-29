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
};

// Инициализируем тему до рендера
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)