import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, LoaderIcon, Mic, MicIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <header className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center">
          {/* Центральная кнопка Lumon */}
          <motion.button
            onClick={() => navigate('/voice-assistant')}
            className={`flex items-center justify-center rounded-full px-4 py-2 relative overflow-hidden w-44 h-9 translate-x-[6px] md:translate-x-0 ${
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
                    {isDownloading ? "Скачивание" : isRecognizing ? "Распознаю" : isListening ? "Слушаю" : isTyping ? "Обработка.docx" : "PROJECT LUMON"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
