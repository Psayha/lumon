import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../components/Toast';

interface LegalDoc {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export const LegalDocsTab: React.FC = () => {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://n8n.psayha.ru/webhook/admin-legal-docs-list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setDocs(data.data);
      } else {
        showToast('error', data.message || 'Не удалось загрузить документы');
      }
    } catch (error) {
      console.error('Error loading legal docs:', error);
      showToast('error', 'Ошибка при загрузке документов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleEdit = (doc: LegalDoc) => {
    setEditingId(doc.id);
    setEditContent(doc.content);
  };

  const handleSave = async (id: string) => {
    // Валидация
    if (!editContent.trim()) {
      showToast('error', 'Содержимое документа не может быть пустым');
      return;
    }
    if (editContent.length > 100000) {
      showToast('error', 'Содержимое документа слишком большое (максимум 100000 символов)');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://n8n.psayha.ru/webhook/admin-legal-docs-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, content: editContent }),
      });
      const data = await response.json();
      if (data.success) {
        showToast('success', 'Документ обновлен');
        await loadDocs();
        setEditingId(null);
        setEditContent('');
      } else {
        showToast('error', data.message || 'Не удалось обновить документ');
      }
    } catch (error) {
      console.error('Error updating doc:', error);
      showToast('error', 'Ошибка при обновлении документа');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Юридические документы</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление документами для модалки AgreementModal
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {docs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Нет документов</p>
          </div>
        ) : (
          docs.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Обновлено: {new Date(doc.updatedAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  {editingId !== doc.id && (
                    <button
                      onClick={() => handleEdit(doc)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Редактировать</span>
                    </button>
                  )}
                </div>

                {editingId === doc.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSave(doc.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Сохранить</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Отмена</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {doc.content}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

