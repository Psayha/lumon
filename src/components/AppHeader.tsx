import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, LoaderIcon, Mic, MicIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';

interface AppHeaderProps {
  isTyping?: boolean;
  showHomeButton?: boolean;
  isListening?: boolean;
  isRecognizing?: boolean;
  isDownloading?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  isTyping = false, 
  isListening = false,
  isRecognizing = false,
  isDownloading = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tg, isReady } = useTelegram();
  const [centerPosition, setCenterPosition] = useState<string>('50%');

  // Вычисляем центр между системными кнопками
  useEffect(() => {
    const updateCenterPosition = () => {
      let safeLeft = 0;
      let safeRight = 0;

      // Получаем safe-area из Telegram API или CSS переменных
      if (isReady && tg) {
        // Попробуем разные способы получения safe-area
        const inset = (tg as any).safeAreaInset || (tg as any).contentSafeAreaInset;
        
        // Обработчик события safeAreaChanged может передавать данные по-другому
        if (inset && typeof inset === 'object') {
          safeLeft = inset.left || 0;
          safeRight = inset.right || 0;
        }
        
        // Если нет inset, попробуем напрямую из tg
        if (safeLeft === 0 && safeRight === 0) {
          const directInset = (tg as any).safeAreaInset;
          if (directInset) {
            safeLeft = directInset.left || 0;
            safeRight = directInset.right || 0;
          }
        }
      }

      // Fallback на CSS переменные (они устанавливаются в App.tsx)
      const root = getComputedStyle(document.documentElement);
      const cssLeft = root.getPropertyValue('--safe-left').trim();
      const cssRight = root.getPropertyValue('--safe-right').trim();
      const cssLeftValue = cssLeft ? parseInt(cssLeft) : null;
      const cssRightValue = cssRight ? parseInt(cssRight) : null;
      
      // Используем значения из CSS переменных, если они установлены
      if (cssLeftValue !== null && cssLeftValue > 0) safeLeft = cssLeftValue;
      if (cssRightValue !== null && cssRightValue > 0) safeRight = cssRightValue;

      // Telegram API часто не предоставляет left/right значения (возвращает 0)
      // В этом случае всегда используем fallback на основе видимости кнопок
      const isRoot = location.pathname === '/';
      
      // Если left/right равны 0, значит Telegram не предоставил эти данные
      // Всегда используем fallback значения для правильного центрирования
      if (safeLeft === 0 && safeRight === 0) {
        // На главной странице BackButton скрыта, справа SettingsButton
        // На внутренних страницах обе кнопки видимы
        
        // SettingsButton всегда видна (кроме полноэкранного режима)
        // На основе визуального анализа: SettingsButton занимает ~50-54px
        // Для правильного центрирования используем среднее значение
        safeRight = isRoot ? 52 : 54;
        
        if (!isRoot && isReady && tg && tg.BackButton) {
          // BackButton с текстом "Назад" видна на скриншоте
          // На основе визуального анализа: BackButton занимает ~66-70px с текстом "Назад"
          // Используем среднее значение для правильного центрирования
          safeLeft = 68;
        }
      } else {
        // Если получили частичные данные от Telegram, дополняем недостающие
        if (safeLeft === 0 && !isRoot && isReady && tg && tg.BackButton) {
          safeLeft = 68;
        }
        if (safeRight === 0) {
          safeRight = isRoot ? 52 : 54;
        }
      }

      // Вычисляем центр доступного пространства между видимыми кнопками
      // Если слева нет кнопки (safeLeft = 0), центр должен учитывать только правую кнопку
      // Если справа нет кнопки (safeRight = 0), центр должен учитывать только левую кнопку
      // Если обе кнопки видимы, центр между ними
      
      let centerX: number;
      const availableWidth = window.innerWidth - safeLeft - safeRight;
      
      if (safeLeft === 0 && safeRight > 0) {
        // Только правая кнопка видна (главная страница)
        // Центр должен быть между левым краем экрана (0) и началом SettingsButton
        // SettingsButton находится справа, занимает safeRight пикселей
        // Центр доступного пространства: (ширина экрана - правая кнопка) / 2
        // Это даст правильное центрирование относительно левого края и правой кнопки
        centerX = (window.innerWidth - safeRight) / 2;
      } else if (safeLeft > 0 && safeRight === 0) {
        // Только левая кнопка видна (редкий случай)
        // Центр: левая кнопка + (ширина экрана - левая кнопка) / 2
        centerX = safeLeft + (window.innerWidth - safeLeft) / 2;
      } else if (safeLeft > 0 && safeRight > 0) {
        // Обе кнопки видимы (внутренние страницы)
        // Центр: левая кнопка + (ширина экрана - левая кнопка - правая кнопка) / 2
        centerX = safeLeft + availableWidth / 2;
      } else {
        // Нет кнопок (fallback на центр экрана)
        centerX = window.innerWidth / 2;
      }
      
      // Логирование для отладки
      console.log('[AppHeader] Center calculation:', {
        pathname: location.pathname,
        safeLeft,
        safeRight,
        windowWidth: window.innerWidth,
        availableWidth,
        centerX,
        centerPercent: ((centerX / window.innerWidth) * 100).toFixed(1) + '%'
      });
      
      setCenterPosition(`${centerX}px`);
    };

    updateCenterPosition();

    // Обновляем при изменении размера окна
    window.addEventListener('resize', updateCenterPosition);
    
    // Обработчики событий safe-area
    let handleSafeAreaChanged: ((payload?: any) => void) | null = null;
    
    if (isReady && tg) {
      handleSafeAreaChanged = (payload?: any) => {
        // Если payload содержит inset, обновляем CSS переменные
        if (payload?.inset) {
          const root = document.documentElement;
          if (payload.inset.left != null) root.style.setProperty('--safe-left', `${payload.inset.left}px`);
          if (payload.inset.right != null) root.style.setProperty('--safe-right', `${payload.inset.right}px`);
        }
        updateCenterPosition();
      };
      
      (tg as any).onEvent?.('safeAreaChanged', handleSafeAreaChanged);
      (tg as any).onEvent?.('contentSafeAreaChanged', handleSafeAreaChanged);
    }

    // Периодическое обновление для надежности
    const interval = setInterval(updateCenterPosition, 100);

    return () => {
      window.removeEventListener('resize', updateCenterPosition);
      clearInterval(interval);
      if (isReady && tg && handleSafeAreaChanged) {
        (tg as any).offEvent?.('safeAreaChanged', handleSafeAreaChanged);
        (tg as any).offEvent?.('contentSafeAreaChanged', handleSafeAreaChanged);
      }
    };
  }, [isReady, tg, location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-safe pointer-events-none">
      <div 
        className="absolute top-0"
        style={{
          left: centerPosition,
          transform: 'translateX(-50%)',
          paddingTop: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px)) + 0.5rem)',
        }}
      >
        {/* Центральная кнопка Lumon */}
        <motion.button
            onClick={() => navigate('/voice-assistant')}
            className={`pointer-events-auto flex items-center justify-center rounded-full px-4 py-2 relative overflow-hidden w-44 h-9 ${
              isDownloading
                ? "bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-400 shadow-2xl shadow-green-500/40 ring-4 ring-green-500/20"
                : isRecognizing
                ? "bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-2xl shadow-orange-500/40 ring-4 ring-orange-500/20"
                : isListening
                ? "bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-400 shadow-2xl shadow-red-500/40 ring-4 ring-red-500/20"
                : isTyping
                ? "bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-2xl shadow-orange-500/40 ring-4 ring-orange-500/20"
                : "bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700"
            }`}
            aria-label="Перейти к голосовому ассистенту Lumon"
            whileHover={!isTyping && !isListening && !isRecognizing && !isDownloading ? { scale: 1.05 } : {}}
            whileTap={!isTyping && !isListening && !isRecognizing && !isDownloading ? { scale: 0.95 } : {}}
            transition={{
              duration: 0.4,
              ease: "easeInOut"
            }}
          >
            {/* Плавный эффект для состояния "Думаю" */}
            {isTyping && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-orange-600/20"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            {/* Плавный эффект для состояния "Слушаю" */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/20 to-red-600/20"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            {/* Плавный эффект для состояния "Скачивание" */}
            {isDownloading && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/25 to-green-600/25"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.03, 1]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            {/* Плавный эффект для состояния "Распознаю" */}
            {isRecognizing && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/25 to-orange-600/25"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.03, 1]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            <div className="relative z-10 flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden ${
                isDownloading
                  ? "bg-green-600 dark:bg-green-400"
                  : isRecognizing
                  ? "bg-orange-600 dark:bg-orange-400"
                  : isListening 
                  ? "bg-red-600 dark:bg-red-400" 
                  : isTyping
                  ? "bg-orange-600 dark:bg-orange-400"
                  : "bg-blue-600 dark:bg-blue-400"
              }`}>
                  <AnimatePresence mode="wait">
                    {isDownloading ? (
                      <motion.div
                        key="downloading"
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: -90
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: 90
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Download className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                    ) : isRecognizing ? (
                      <motion.div
                        key="recognizing"
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: -90
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: 90
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <MicIcon className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                    ) : isListening ? (
                      <motion.div
                        key="listening"
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: -90
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: 90
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.08, 1],
                          rotate: [0, 3, -3, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Mic className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                    ) : isTyping ? (
                      <motion.div
                        key="loading"
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: -90
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: 90
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <LoaderIcon className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                    ) : (
                      <motion.div
                        key="brain"
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: -90
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.6,
                          rotate: 90
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Brain className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                    )}
                  </AnimatePresence>
              </div>
              <div className="relative w-24 h-4 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span 
                    className="absolute text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap"
                    key={isDownloading ? "downloading" : isRecognizing ? "recognizing" : isListening ? "listening" : isTyping ? "thinking" : "lumon"}
                    initial={{ opacity: 0, scale: 0.8, y: 2 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -2 }}
                    transition={{ 
                      duration: 0.4, 
                      ease: [0.4, 0, 0.2, 1],
                      scale: { duration: 0.3 }
                    }}
                  >
                    {isDownloading ? "Скачивание" : isRecognizing ? "Распознаю" : isListening ? "Слушаю" : isTyping ? "Обработка" : "PROJECT LUMON"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.button>
      </div>
    </header>
  );
};
