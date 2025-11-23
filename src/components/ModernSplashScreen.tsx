import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface ModernSplashScreenProps {
  children: React.ReactNode;
}

export const ModernSplashScreen: React.FC<ModernSplashScreenProps> = ({ children }) => {
  console.log('[SplashScreen] Компонент ModernSplashScreen монтируется');
  const [isLoading, setIsLoading] = useState(true);
  const { tg, isReady } = useTelegram();
  const startTimeRef = useRef<number>(Date.now());
  const MIN_LOADING_TIME = 2000; // Минимум 2 секунды показа загрузочного экрана
  
  console.log('[SplashScreen] useTelegram результат:', { hasTg: !!tg, isReady });

  // Отслеживаем готовность Telegram и скрываем экран загрузки
  // Загрузочный экран показывается минимум 2 секунды для сбора данных
  useEffect(() => {
    if (!isReady) return;

    const checkAndHide = () => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      // Ждем минимум 2 секунды показа экрана, даже если Telegram уже готов
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime + 300); // +300ms для плавного перехода
    };

    checkAndHide();
  }, [isReady]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Современный анимированный фон с градиентными волнами */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-400/30 to-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
              x: [0, -40, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Плавающие частицы */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/40 dark:bg-blue-300/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}

        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          {/* Логотип с современным дизайном */}
          <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
            <div className="w-28 h-28 mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-white/30 dark:border-slate-700/50 flex items-center justify-center relative overflow-hidden">
              {/* Анимированный градиентный фон */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(147, 51, 234, 0.15) 100%)",
                    "linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(99, 102, 241, 0.15) 100%)",
                    "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)"
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Свечение вокруг иконки */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-3xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Иконка с плавным вращением */}
              <motion.div
                className="relative z-10"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  rotate: {
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  },
                  scale: {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <Brain className="w-14 h-14 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              </motion.div>

              {/* Декоративные элементы */}
              <motion.div
                className="absolute -top-2 -right-2 z-20"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              </motion.div>

              <motion.div
                className="absolute -bottom-1 -left-1 z-20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.9, 0.5],
                  rotate: [0, -180, -360],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Название с градиентом */}
          <motion.h1
            className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            Lumon
          </motion.h1>

          <motion.p
            className="text-lg text-slate-600 dark:text-slate-400 mb-12 font-medium tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            AI-Powered Business Platform
          </motion.p>

          {/* Современный индикатор загрузки (пульсирующие точки) */}
          <motion.div
            className="flex justify-center items-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full shadow-lg"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
