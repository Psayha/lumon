import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, LoaderIcon, Mic, MicIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppHeaderProps {
  isTyping?: boolean;
  showHomeButton?: boolean;
  isListening?: boolean;
  isRecognizing?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  isTyping = false, 
  isListening = false,
  isRecognizing = false
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center">
          {/* Центральная кнопка Lumon */}
          <motion.button
            onClick={() => navigate('/voice-assistant')}
            className={`flex items-center justify-center rounded-full px-4 py-2 relative overflow-hidden w-40 h-9 ${
              isRecognizing
                ? "bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-2xl shadow-orange-500/40 ring-4 ring-orange-500/20"
                : isListening
                ? "bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-400 shadow-2xl shadow-red-500/40 ring-4 ring-red-500/20"
                : isTyping
                ? "bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-2xl shadow-orange-500/40 ring-4 ring-orange-500/20"
                : "bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700"
            }`}
            aria-label="Перейти к голосовому ассистенту Lumon"
            whileHover={!isTyping && !isListening && !isRecognizing ? { scale: 1.05 } : {}}
            whileTap={!isTyping && !isListening && !isRecognizing ? { scale: 0.95 } : {}}
            transition={{
              duration: 0.4,
              ease: "easeInOut"
            }}
          >
            {isTyping && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "linear-gradient(45deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.3) 25%, rgba(194, 65, 12, 0.3) 50%, rgba(154, 52, 18, 0.3) 75%, rgba(249, 115, 22, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(154, 52, 18, 0.3) 0%, rgba(249, 115, 22, 0.3) 25%, rgba(234, 88, 12, 0.3) 50%, rgba(194, 65, 12, 0.3) 75%, rgba(154, 52, 18, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(194, 65, 12, 0.3) 0%, rgba(154, 52, 18, 0.3) 25%, rgba(249, 115, 22, 0.3) 50%, rgba(234, 88, 12, 0.3) 75%, rgba(194, 65, 12, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(234, 88, 12, 0.3) 0%, rgba(194, 65, 12, 0.3) 25%, rgba(154, 52, 18, 0.3) 50%, rgba(249, 115, 22, 0.3) 75%, rgba(234, 88, 12, 0.3) 100%)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            {isTyping && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 50%, rgba(194, 65, 12, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(194, 65, 12, 0.2) 0%, rgba(154, 52, 18, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(154, 52, 18, 0.2) 0%, rgba(249, 115, 22, 0.2) 50%, rgba(234, 88, 12, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(249, 115, 22, 0.2) 50%, rgba(194, 65, 12, 0.2) 100%)"
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            {/* Эффекты микрофона */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "linear-gradient(45deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 25%, rgba(185, 28, 28, 0.3) 50%, rgba(153, 27, 27, 0.3) 75%, rgba(239, 68, 68, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(153, 27, 27, 0.3) 0%, rgba(239, 68, 68, 0.3) 25%, rgba(220, 38, 38, 0.3) 50%, rgba(185, 28, 28, 0.3) 75%, rgba(153, 27, 27, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(185, 28, 28, 0.3) 0%, rgba(153, 27, 27, 0.3) 25%, rgba(239, 68, 68, 0.3) 50%, rgba(220, 38, 38, 0.3) 75%, rgba(185, 28, 28, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.3) 25%, rgba(153, 27, 27, 0.3) 50%, rgba(239, 68, 68, 0.3) 75%, rgba(220, 38, 38, 0.3) 100%)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 50%, rgba(185, 28, 28, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(185, 28, 28, 0.2) 0%, rgba(153, 27, 27, 0.2) 50%, rgba(239, 68, 68, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(153, 27, 27, 0.2) 0%, rgba(239, 68, 68, 0.2) 50%, rgba(220, 38, 38, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 50%, rgba(185, 28, 28, 0.2) 100%)"
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            {/* Эффекты распознавания */}
            {isRecognizing && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "linear-gradient(45deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.3) 25%, rgba(194, 65, 12, 0.3) 50%, rgba(154, 52, 18, 0.3) 75%, rgba(249, 115, 22, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(154, 52, 18, 0.3) 0%, rgba(249, 115, 22, 0.3) 25%, rgba(234, 88, 12, 0.3) 50%, rgba(194, 65, 12, 0.3) 75%, rgba(154, 52, 18, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(194, 65, 12, 0.3) 0%, rgba(154, 52, 18, 0.3) 25%, rgba(249, 115, 22, 0.3) 50%, rgba(234, 88, 12, 0.3) 75%, rgba(194, 65, 12, 0.3) 100%)",
                    "linear-gradient(45deg, rgba(234, 88, 12, 0.3) 0%, rgba(194, 65, 12, 0.3) 25%, rgba(154, 52, 18, 0.3) 50%, rgba(249, 115, 22, 0.3) 75%, rgba(234, 88, 12, 0.3) 100%)"
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            {isRecognizing && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 50%, rgba(194, 65, 12, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(194, 65, 12, 0.2) 0%, rgba(154, 52, 18, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(154, 52, 18, 0.2) 0%, rgba(249, 115, 22, 0.2) 50%, rgba(234, 88, 12, 0.2) 100%)",
                    "linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(249, 115, 22, 0.2) 50%, rgba(194, 65, 12, 0.2) 100%)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            <div className="relative z-10 flex items-center space-x-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden ${
                isRecognizing
                  ? "bg-orange-600 dark:bg-orange-400"
                  : isListening 
                  ? "bg-red-600 dark:bg-red-400" 
                  : isTyping
                  ? "bg-orange-600 dark:bg-orange-400"
                  : "bg-blue-600 dark:bg-blue-400"
              }`}>
                <AnimatePresence mode="wait">
                  {isRecognizing ? (
                    <motion.div
                      key="recognizing"
                      className="relative"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: -180,
                        y: 10
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotate: 0,
                        y: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: 180,
                        y: -10
                      }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.4, 0, 0.2, 1],
                        rotate: {
                          duration: 0.5,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 1.2,
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
                      className="relative"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: -180,
                        y: 10
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotate: 0,
                        y: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: 180,
                        y: -10
                      }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.4, 0, 0.2, 1],
                        rotate: {
                          duration: 0.5,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                          duration: 1,
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
                      className="relative"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: -180,
                        y: 10
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotate: 0,
                        y: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: 180,
                        y: -10
                      }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.4, 0, 0.2, 1],
                        rotate: {
                          duration: 0.5,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <LoaderIcon className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="brain"
                      className="relative"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: -180,
                        y: 10
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotate: 0,
                        y: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: 180,
                        y: -10
                      }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.4, 0, 0.2, 1],
                        rotate: {
                          duration: 0.5,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                    >
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
                        <Brain className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.span 
                  className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap"
                  key={isRecognizing ? "recognizing" : isListening ? "listening" : isTyping ? "thinking" : "lumon"}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {isRecognizing ? "Распознаю" : isListening ? "Слушаю" : isTyping ? "Думаю" : "PROJECT LUMON"}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
