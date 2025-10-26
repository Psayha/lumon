import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Инициализация темы при загрузке приложения
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const root = document.documentElement;
  
  console.log('Initializing theme:', savedTheme);
  
  if (savedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Инициализируем тему до рендера
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)