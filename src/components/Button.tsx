import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'info':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        dark:focus:ring-offset-gray-800
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Загрузка...
        </div>
      ) : (
        children
      )}
    </button>
  );
};
