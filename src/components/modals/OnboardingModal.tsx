import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { isTelegramWebApp } from '../../hooks/useTelegram';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (answers: string[]) => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  category: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  // Генерируем 3 случайных вопроса
  const allQuestions: Question[] = [
    {
      id: 1,
      question: "Какая основная цель использования PROJECT LUMON в вашей компании?",
      options: [
        "Автоматизация рутинных задач",
        "Улучшение клиентского сервиса",
        "Оптимизация бизнес-процессов",
        "Аналитика и отчетность"
      ],
      category: "Цели"
    },
    {
      id: 2,
      question: "Сколько человек в вашей команде?",
      options: [
        "1-5 человек",
        "6-20 человек",
        "21-50 человек",
        "Более 50 человек"
      ],
      category: "Команда"
    },
    {
      id: 3,
      question: "Какой у вас опыт работы с AI-инструментами?",
      options: [
        "Новичок, только начинаю",
        "Есть базовый опыт",
        "Опытный пользователь",
        "Эксперт в области AI"
      ],
      category: "Опыт"
    },
    {
      id: 4,
      question: "Какие задачи вы планируете автоматизировать в первую очередь?",
      options: [
        "Обработка документов",
        "Коммуникация с клиентами",
        "Анализ данных",
        "Управление проектами"
      ],
      category: "Задачи"
    },
    {
      id: 5,
      question: "Как часто вы планируете использовать платформу?",
      options: [
        "Ежедневно",
        "Несколько раз в неделю",
        "Еженедельно",
        "По мере необходимости"
      ],
      category: "Частота"
    },
    {
      id: 6,
      question: "Какая отрасль лучше всего описывает вашу компанию?",
      options: [
        "IT и технологии",
        "Финансы и банкинг",
        "E-commerce и ритейл",
        "Консалтинг и услуги"
      ],
      category: "Отрасль"
    }
  ];

  // Выбираем 3 случайных вопроса
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Перемешиваем и берем первые 3 вопроса
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      setSelectedQuestions(shuffled.slice(0, 3));
      setCurrentStep(0);
      setAnswers([]);
      setSelectedAnswer('');
    }
  }, [isOpen]);

  // Блокируем скролл body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Для Telegram Mini App настраиваем кнопку "Назад" для завершения онбординга
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram.WebApp;
        tg.MainButton.hide();
        
        // Показываем кнопку "Назад" и завершаем онбординг с текущими ответами
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          onComplete(answers);
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    // Очищаем стили при размонтировании
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, answers, onComplete]);

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers, selectedAnswer];
      setAnswers(newAnswers);
      
      if (currentStep < selectedQuestions.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer('');
      } else {
        onComplete(newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedAnswer(answers[currentStep - 1] || '');
    }
  };

  if (!isOpen || selectedQuestions.length === 0) return null;

  const currentQuestion = selectedQuestions[currentStep];
  const progress = ((currentStep + 1) / selectedQuestions.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] mx-2 sm:mx-0"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Настройка профиля
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Помогите нам лучше понять ваши потребности
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Вопрос {currentStep + 1} из {selectedQuestions.length}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Question */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                    {currentQuestion.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === option
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedAnswer === option
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedAnswer === option && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm sm:text-base font-medium">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  currentStep === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedAnswer}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${
                  selectedAnswer
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {currentStep === selectedQuestions.length - 1 ? 'Завершить' : 'Далее'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer with Back Button for TMA */}
          {isTelegramWebApp() && (
            <div className="p-3 sm:p-4 border-t border-gray-200/50 dark:border-white/[0.05]">
              <button
                onClick={handlePrevious}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Назад
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
