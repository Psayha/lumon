import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavigationProps {
  items: NavigationItem[];
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  className = ''
}) => {
  const location = useLocation();

  return (
    <nav className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to="/" 
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150"
              >
                Lumon
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {items.map((item) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      transition-colors duration-150
                      ${isActive
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }
                    `}
                  >
                    {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};