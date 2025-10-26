import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface SplashScreenProps {
  children: React.ReactNode;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  const phrases = [
    "Отлично, что начали пользоваться Lumon!",
    "Теперь вы узнаете, как AI может помочь вашему бизнесу",
    "Мы покажем, как автоматизировать рутинные задачи",
    "Вы увидите, как умная аналитика улучшит решения",
    "Готовы к новому уровню продуктивности?"
  ];

  // Случайно выбираем одну фразу при загрузке
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  useEffect(() => {
    // Показываем загрузочный экран 2 секунды
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen gradient-bg flex items-center justify-center text-gray-900 dark:text-white relative overflow-hidden">
        {/* Анимированные фоновые элементы */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-500" />
        </div>

        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Анимированный логотип */}
          <motion.div 
            className="w-28 h-28 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border border-gray-200/50 dark:border-white/[0.05] relative overflow-hidden"
            initial={{ scale: 0.8, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Пульсирующий фон */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)",
                  "linear-gradient(45deg, rgba(236, 72, 153, 0.2) 0%, rgba(34, 197, 94, 0.2) 50%, rgba(59, 130, 246, 0.2) 100%)",
                  "linear-gradient(45deg, rgba(34, 197, 94, 0.2) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)",
                  "linear-gradient(45deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(34, 197, 94, 0.2) 100%)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Иконка Brain с анимацией */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Brain className="w-14 h-14 text-blue-600 dark:text-blue-400 relative z-10" />
            </motion.div>
          </motion.div>
          
          {/* Название с градиентом */}
                 <motion.h1 
                   className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 mb-4"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3, duration: 0.6 }}
                 >
                   PROJECT LUMON
                 </motion.h1>

          {/* Подзаголовок */}
          <motion.p 
            className="text-xl text-gray-700 dark:text-gray-300 mb-8 font-medium text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {randomPhrase}
          </motion.p>

          {/* Анимированная линия */}
          <motion.div 
            className="h-px bg-gradient-to-r from-transparent via-gray-400/20 dark:via-white/20 to-transparent mx-auto max-w-xs"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
          />

          {/* Загрузочные точки */}
          <motion.div 
            className="flex justify-center space-x-3 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
