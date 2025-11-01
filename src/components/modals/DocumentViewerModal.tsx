import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2 } from 'lucide-react';
import { isTelegramWebApp } from '../../hooks/useTelegram';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: number;
    name: string;
    description: string;
    category: string;
    type: string;
    size: string;
    uploadDate: string;
    status: string;
    views: number;
  } | null;
  isOwner: boolean;
  onDownload?: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  document: doc, 
  isOwner,
  onDownload
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

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


  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'link': return '🔗';
      default: return '📄';
    }
  };

  const handleDelete = () => {
    if (!isDeleting) {
      setIsDeleting(true);
    } else {
      console.log('Удаление документа:', doc?.name);
      onClose();
    }
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  const handleDownload = () => {
    console.log('Скачивание документа:', doc?.name);
    onClose();
    if (onDownload) {
      onDownload();
    }
  };

  if (!doc) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span className="text-3xl flex-shrink-0">{getFileIcon(doc.type)}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {doc.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-3 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Document Info */}
              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Описание документа
                  </h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              {/* Document Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Анализ полноты информации
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Полнота информации
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {doc.status === 'processed' ? '85%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        doc.status === 'processed' 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ 
                        width: doc.status === 'processed' ? '85%' : '0%' 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {doc.status === 'processed' 
                      ? 'Документ содержит достаточно информации для понимания бизнеса'
                      : 'Документ требует дополнительной обработки для анализа'
                    }
                  </p>
                </div>
              </div>

              {/* Document Content (if processed by AI) */}
              {doc.status === 'processed' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Документ успешно обработан ИИ и готов для использования в рекомендациях и аналитике.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center px-3 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {!isDeleting && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center space-x-2 px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 min-w-[140px]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать</span>
                  </button>
                )}
                
                {isOwner && (
                  <>
                    {!isDeleting ? (
                      <button
                        onClick={handleDelete}
                        className="flex items-center justify-center space-x-2 px-8 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 min-w-[140px]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancelDelete}
                          className="flex items-center justify-center space-x-2 px-8 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 min-w-[140px]"
                        >
                          <span>Отменить</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          className="flex items-center justify-center space-x-2 px-8 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 min-w-[140px]"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Удалить</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentViewerModal;
