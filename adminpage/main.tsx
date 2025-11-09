import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminPage from './AdminPage';
import '../src/index.css';

// Применяем системную тему сразу при загрузке
const applySystemTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Применяем тему до рендера
applySystemTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminPage />
  </React.StrictMode>
);

