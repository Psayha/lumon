import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-10 h-10';
      case 'lg':
        return 'w-16 h-16';
      default:
        return 'w-10 h-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-5 h-5';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div 
        className={`${getSizeClasses()} bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-500/20`}
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: 360 
        }}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }
        }}
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
        
        {/* Иконка Brain */}
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
          <Brain className={`${getIconSize()} text-white relative z-10`} />
        </motion.div>
      </motion.div>
      
      {text && (
        <motion.p 
          className="mt-3 text-sm text-gray-600/60 dark:text-white/40 font-medium"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};
