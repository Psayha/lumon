import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface AppFooterProps {
  showHomeButton?: boolean;
  className?: string;
  isOwner?: boolean;
  onRoleChange?: (isOwner: boolean) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ 
  showHomeButton = true,
  className = '',
  isOwner = true,
  onRoleChange
}) => {
  const navigate = useNavigate();

  return (
    <footer className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-2 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center gap-4">
          {showHomeButton && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Перейти на главную страницу"
            >
              <Home className="w-3 h-3" />
            </button>
          )}
          
          {/* Role Switcher */}
          <div className="flex items-center space-x-1 bg-white/80 dark:bg-white/[0.02] rounded-lg p-1">
            <button
              onClick={() => onRoleChange?.(true)}
              className={`w-8 h-8 rounded-md transition-colors duration-200 flex items-center justify-center ${
                isOwner
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Основатель"
            >
              👑
            </button>
            <button
              onClick={() => onRoleChange?.(false)}
              className={`w-8 h-8 rounded-md transition-colors duration-200 flex items-center justify-center ${
                !isOwner
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Менеджер"
            >
              👤
            </button>
          </div>
          
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
};
