import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface AppFooterProps {
  showHomeButton?: boolean;
  className?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({ 
  showHomeButton = true,
  className = ''
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
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
};
