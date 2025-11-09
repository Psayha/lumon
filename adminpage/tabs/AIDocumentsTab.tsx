import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Upload, FileText, Trash2, Download, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { adminApiRequest, ADMIN_API_CONFIG } from '../config/api';

interface AIDocument {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
  status: 'processed' | 'processing' | 'error';
}

export const AIDocumentsTab: React.FC = () => {
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await adminApiRequest<AIDocument[]>(ADMIN_API_CONFIG.endpoints.adminAiDocsList);
      if (data.success && data.data) {
        setDocuments(data.data);
      } else {
        const errorMsg = data.message || 'Ошибка сервера: не удалось загрузить документы';
        showToast('error', errorMsg);
      }
    } catch (error: any) {
      showToast('error', error?.message || 'Ошибка при загрузке документов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Валидация файлов
    const maxSize = 50 * 1024 * 1024; // 50 MB
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(ext)) {
        invalidFiles.push(file.name);
      }
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (слишком большой)`);
      }
    });

    if (invalidFiles.length > 0) {
      showToast('error', `Некорректные файлы: ${invalidFiles.join(', ')}`);
      return;
    }

    setIsUploading(true);
    showToast('info', 'Загрузка документов...');

    // TODO: Реализовать загрузку файлов через API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    showToast('success', 'Документы загружены');
    setIsUploading(false);
    await loadDocuments();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminAiDocsDelete, {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      if (data.success) {
        showToast('success', 'Документ удален');
        await loadDocuments();
      } else {
        showToast('error', data.message || 'Не удалось удалить документ');
      }
    } catch (error) {
      showToast('error', 'Ошибка при удалении документа');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      processed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status as keyof typeof styles] || styles.processed;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Документы для ИИ</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Загружайте документы для обучения AI модели
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Загрузка...' : 'Загрузить документы'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Area */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">Загрузка документов...</span>
          </div>
        </motion.div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Нет загруженных документов</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Загрузите документы для обучения AI
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {doc.filename}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.size)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(doc.status)}`}
                      >
                        {doc.status === 'processed' ? 'Обработан' : doc.status === 'processing' ? 'Обработка' : 'Ошибка'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

