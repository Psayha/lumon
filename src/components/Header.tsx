import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-transparent sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/voice-assistant')}
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 rounded-full px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300 ease-out"
            aria-label="Перейти на главную страницу Lumon"
          >
              <div className="w-6 h-6 bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              Lumon
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
