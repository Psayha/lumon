import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { AppHeader } from '../src/components/AppHeader';
// import { AppFooter } from '../src/components/AppFooter';
import UploadDocumentsModal from '../src/components/modals/UploadDocumentsModal';
import DocumentViewerModal from '../src/components/modals/DocumentViewerModal';

// Mock данные
const mockDocuments = [
  {
    id: 1,
    name: 'Презентация компании.pdf',
    description: 'Основная презентация о компании, наших услугах и преимуществах',
    category: 'О компании',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2024-01-15',
    status: 'processed',
    views: 45
  },
  {
    id: 2,
    name: 'Скрипт холодных звонков.docx',
    description: 'Пошаговый алгоритм для холодных звонков с примерами фраз',
    category: 'Скрипты продаж',
    type: 'docx',
    size: '156 KB',
    uploadDate: '2024-01-14',
    status: 'processing',
    views: 23
  },
  {
    id: 3,
    name: 'FAQ клиентов.txt',
    description: 'Часто задаваемые вопросы и ответы для клиентов',
    category: 'FAQ',
    type: 'txt',
    size: '89 KB',
    uploadDate: '2024-01-13',
    status: 'processed',
    views: 67
  },
  {
    id: 4,
    name: 'Политика конфиденциальности.pdf',
    description: 'Документ с правилами обработки персональных данных и конфиденциальной информации',
    category: 'Документы',
    type: 'pdf',
    size: '1.8 MB',
    uploadDate: '2024-01-12',
    status: 'processed',
    views: 89
  },
  {
    id: 5,
    name: 'Шаблон договора.docx',
    description: 'Стандартный шаблон договора для работы с клиентами',
    category: 'Шаблоны',
    type: 'docx',
    size: '234 KB',
    uploadDate: '2024-01-11',
    status: 'processed',
    views: 134
  },
  {
    id: 6,
    name: 'Инструкция по использованию.txt',
    description: 'Подробная инструкция по работе с системой для новых пользователей',
    category: 'Инструкции',
    type: 'txt',
    size: '67 KB',
    uploadDate: '2024-01-10',
    status: 'error',
    views: 12
  }
];


const KnowledgeBasePage: React.FC = () => {
  const [isOwner, setIsOwner] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documents] = useState(mockDocuments);
  const [isDownloading, setIsDownloading] = useState(false);

  // Фиксируем страницу - предотвращаем скролл body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Проверяем есть ли документы в обработке
  const hasProcessingDocuments = documents.some(doc => doc.status === 'processing');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'link': return '🔗';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'processing': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed': return 'Обработан';
      case 'processing': return 'В процессе';
      case 'error': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    console.log('Начало скачивания документа:', selectedDocument?.name);
    
    // Симуляция процесса скачивания
    setTimeout(() => {
      setIsDownloading(false);
      console.log('Скачивание завершено');
    }, 3000);
  };

  return (
    <>
      {/* Контент занимает весь экран, включая safe-area */}
      <div 
        className="fixed gradient-bg overflow-hidden flex flex-col inset-0"
        style={{
          height: '100dvh'
        }}
      >
        <AppHeader isDownloading={isDownloading} isTyping={hasProcessingDocuments} />
        
        {/* Фоновые эффекты */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-red-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
        </div>
        
        {/* Скроллируемый контент с отступом от header */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-[calc(var(--safe-top,0px)+52px)] pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full relative z-10">
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 dark:from-pink-400 dark:via-rose-400 dark:to-red-400 mb-2">
                База Знаний
              </h1>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDocumentViewer(true);
                  }}
                  className="relative backdrop-blur-xl bg-white/80 dark:bg-white/[0.02] rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/[0.05] p-3 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(doc.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {doc.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Отступ от подвала */}
            <div className="pb-4"></div>
          </div>
        </div>

        {/* Upload Button */}
        {isOwner && (
          <div className="fixed bottom-24 right-6 z-50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center"
            >
              <Upload className="w-6 h-6" />
            </motion.button>
          </div>
        )}

        {/* <AppFooter 
          showHomeButton={true} 
          isOwner={isOwner}
          onRoleChange={setIsOwner}
        /> */}
      </div>

      {/* Градиентное размытие сверху с плавным переходом */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] pointer-events-none overflow-hidden"
        style={{
          height: `calc(var(--safe-top, 0px) + 40px)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 bg-white/10 dark:bg-black/10"
          style={{
            height: `calc(var(--safe-top, 0px) + 40px)`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      </div>
      
      {/* Правая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-right, 0px)'
        }}
      />
      
      {/* Левая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-left, 0px)'
        }}
      />

      {/* Modals */}
      <UploadDocumentsModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
      
      <DocumentViewerModal 
        isOpen={showDocumentViewer} 
        onClose={() => setShowDocumentViewer(false)}
        document={selectedDocument}
        isOwner={isOwner}
        onDownload={handleDownload}
      />
    </>
  );
};

export default KnowledgeBasePage;
