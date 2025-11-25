import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { API_CONFIG, getApiUrl } from '../config/api';
import { logger } from '../lib/logger';

interface LegalDocsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  initData: string;
}

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({ isOpen, onAccept, initData }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.authAcceptLegal), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          version: '1.0',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept documents');
      }

      const data = await response.json();
      if (data.success) {
        onAccept();
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (err) {
      logger.error('Error accepting legal docs:', err);
      setError('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Юридические документы</h2>
            <p className="text-blue-100 text-sm">Пожалуйста, примите условия использования</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <FileText className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">Пользовательское соглашение</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Правила использования сервиса и ответственность сторон.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <Shield className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">Политика конфиденциальности</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Как мы собираем, храним и обрабатываем ваши данные.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAccepting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Принять и продолжить</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                Нажимая кнопку, вы соглашаетесь со всеми документами
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
