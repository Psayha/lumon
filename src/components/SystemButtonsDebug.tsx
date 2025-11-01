import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';

export const SystemButtonsDebug: React.FC = () => {
  const { tg, isReady } = useTelegram();
  const [showDebug, setShowDebug] = useState(() => {
    // По умолчанию показываем для отладки центрирования
    // Можно отключить через localStorage или URL параметр
    const urlParam = new URLSearchParams(window.location.search).get('debug');
    const stored = localStorage.getItem('showSystemButtonsDebug');
    
    // Если в URL есть debug=buttons - показываем
    if (urlParam === 'buttons') return true;
    // Если в URL есть debug=off - скрываем
    if (urlParam === 'off') return false;
    // Если в localStorage явно 'false' - скрываем
    if (stored === 'false') return false;
    // Во всех остальных случаях - показываем
    return true;
  });
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    // Обновляем localStorage при изменении состояния
    if (showDebug) {
      localStorage.setItem('showSystemButtonsDebug', 'true');
    } else {
      localStorage.removeItem('showSystemButtonsDebug');
    }
  }, [showDebug]);

  useEffect(() => {
    const updateSafeArea = () => {
      if (isReady && tg) {
        const inset = (tg as any).safeAreaInset || (tg as any).contentSafeAreaInset || {};
        setSafeArea({
          top: inset.top || parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0,
          right: inset.right || parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-right')) || 0,
          bottom: inset.bottom || parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0,
          left: inset.left || parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-left')) || 0,
        });
      } else {
        // Fallback для веб-версии: используем CSS переменные
        const root = getComputedStyle(document.documentElement);
        setSafeArea({
          top: parseInt(root.getPropertyValue('--safe-top')) || 0,
          right: parseInt(root.getPropertyValue('--safe-right')) || 0,
          bottom: parseInt(root.getPropertyValue('--safe-bottom')) || 0,
          left: parseInt(root.getPropertyValue('--safe-left')) || 0,
        });
      }
    };

    updateSafeArea();
    
    if (isReady && tg) {
      (tg as any).onEvent?.('safeAreaChanged', updateSafeArea);
      (tg as any).onEvent?.('contentSafeAreaChanged', updateSafeArea);
    }

    // Периодическое обновление для надежности
    const interval = setInterval(updateSafeArea, 500);

    return () => {
      if (isReady && tg) {
        (tg as any).offEvent?.('safeAreaChanged', updateSafeArea);
        (tg as any).offEvent?.('contentSafeAreaChanged', updateSafeArea);
      }
      clearInterval(interval);
    };
  }, [isReady, tg]);

  if (!showDebug) return null;

  return (
    <>
      {/* Индикатор области системной кнопки слева (BackButton) */}
      <div
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: `${Math.max(safeArea.left, 44)}px`,
          height: `${safeArea.top + 44}px`,
          border: '3px dashed rgba(255, 0, 0, 0.7)',
          backgroundColor: 'rgba(255, 0, 0, 0.15)',
          boxShadow: '0 0 10px rgba(255, 0, 0, 0.3)',
        }}
      >
        <div className="absolute bottom-2 left-2 text-xs text-red-700 dark:text-red-300 font-bold bg-red-100/90 dark:bg-red-900/60 px-2 py-1 rounded">
          ← Back Button
        </div>
        <div className="absolute top-0 left-0 text-[10px] text-red-700 dark:text-red-300 font-bold p-1.5 bg-red-200/90 dark:bg-red-800/60 rounded-br">
          L: {safeArea.left}px
        </div>
      </div>

      {/* Индикатор области системной кнопки справа */}
      <div
        className="fixed top-0 right-0 z-[9999] pointer-events-none"
        style={{
          width: `${Math.max(safeArea.right, 44)}px`,
          height: `${safeArea.top + 44}px`,
          border: '3px dashed rgba(0, 128, 255, 0.7)',
          backgroundColor: 'rgba(0, 128, 255, 0.15)',
          boxShadow: '0 0 10px rgba(0, 128, 255, 0.3)',
        }}
      >
        <div className="absolute bottom-2 right-2 text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100/90 dark:bg-blue-900/60 px-2 py-1 rounded">
          Menu Button →
        </div>
        <div className="absolute top-0 right-0 text-[10px] text-blue-700 dark:text-blue-300 font-bold p-1.5 bg-blue-200/90 dark:bg-blue-800/60 rounded-bl">
          R: {safeArea.right}px
        </div>
      </div>

      {/* Индикатор центральной области (где должна быть кнопка PROJECT LUMON) */}
      <div
        className="fixed top-0 left-1/2 transform -translate-x-1/2 z-[9998] pointer-events-none"
        style={{
          width: '200px',
          height: `${safeArea.top + 44}px`,
          border: '3px dashed rgba(0, 255, 0, 0.7)',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
        }}
      >
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-green-700 dark:text-green-300 font-bold bg-green-100/90 dark:bg-green-900/60 px-2 py-1 rounded whitespace-nowrap">
          ↑ Центр (PROJECT LUMON)
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[10px] text-green-700 dark:text-green-300 font-bold p-1.5 bg-green-200/90 dark:bg-green-800/60 rounded-b whitespace-nowrap">
          T: {safeArea.top}px
        </div>
      </div>

      {/* Информационная панель */}
      <div className="fixed bottom-4 left-4 right-4 z-[9999] pointer-events-auto bg-black/90 dark:bg-white/95 text-white dark:text-black p-4 rounded-lg text-xs font-mono backdrop-blur-md border-2 border-white/30 shadow-2xl">
        <div className="mb-3 font-bold text-sm text-center">
          🎯 Отладка системных кнопок Telegram
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-red-400 dark:text-red-600">Left (Back): {safeArea.left}px</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-blue-400 dark:text-blue-600">Right (Menu): {safeArea.right}px</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-green-400 dark:text-green-600">Top: {safeArea.top}px</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-yellow-400 dark:text-yellow-600">Bottom: {safeArea.bottom}px</span>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-white/20 flex gap-2 justify-center">
          <button
            onClick={() => setShowDebug(false)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors"
          >
            Скрыть отладку
          </button>
          <button
            onClick={() => {
              setShowDebug(false);
              localStorage.removeItem('showSystemButtonsDebug');
            }}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-semibold transition-colors"
          >
            Выключить полностью
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] opacity-70">
          💡 Добавьте ?debug=buttons в URL для включения
        </div>
      </div>
    </>
  );
};
