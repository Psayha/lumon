import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, CheckCircle } from 'lucide-react';

// Telegram WebApp detection
const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && (window as any).Telegram?.WebApp;
};

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    message: ''
  });

  // Блокируем скролл фона при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Для Telegram Mini App скрываем штатные кнопки
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram.WebApp;
        tg.BackButton.hide();
        tg.MainButton.hide();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Консультация запрошена:', { formData });
    setIsSubmitted(true);
    
    // Автоматически закрываем модальное окно через 3 секунды
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setFormData({ message: '' });
    }, 3000);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-sm sm:max-w-md bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/[0.05] overflow-hidden mx-2 sm:mx-0 max-h-[95vh] sm:max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-3 sm:p-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold">Консультация с Алексеем</h2>
                  <p className="text-xs opacity-90">Эксперт по автоматизации</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {isSubmitted ? (
                /* Success Message */
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </motion.div>
                  
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Заявка отправлена успешно!
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Алексей получил ваш запрос и свяжется с вами в ближайшее время
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                      <Clock className="w-3 h-3" />
                      <span>Ответ в течение 2 часов</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Модальное окно закроется автоматически через несколько секунд
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Сообщение
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={handleInputChange('message')}
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                        placeholder="Опишите ваш вопрос или задачу..."
                        required
                      />
                    </div>

                    {/* Availability Info */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>Ответ в течение 2 часов</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Отправить запрос
                    </motion.button>
                  </form>
                </>
              )}
            </div>

            {/* Footer with Back Button for TMA */}
            {isTelegramWebApp() && (
              <div className="p-3 sm:p-4 border-t border-gray-200/50 dark:border-white/[0.05]">
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Назад
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsultationModal;
