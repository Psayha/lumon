import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { ViewerRestrictionsModal } from './modals/ViewerRestrictionsModal';

interface PageGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'owner' | 'manager' | 'viewer'>;
  blockViewer?: boolean;
}

export const PageGuard: React.FC<PageGuardProps> = ({
  children,
  allowedRoles,
  blockViewer = false
}) => {
  const { role, isLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRestrictionsModal, setShowRestrictionsModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Если роль viewer и блокировка включена
    if (role === 'viewer' && blockViewer) {
      setShowRestrictionsModal(true);
      return;
    }

    // Если указаны разрешённые роли
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      setShowRestrictionsModal(true);
      return;
    }

    // Если роль null (не загружена), разрешаем доступ (AuthGuard обработает)
    if (role === null) {
      return;
    }
  }, [role, isLoading, blockViewer, allowedRoles]);

  const handleCloseModal = () => {
    setShowRestrictionsModal(false);
    // Перенаправляем на главную страницу
    navigate('/');
  };

  const handleConnectCompany = () => {
    setShowRestrictionsModal(false);
    // Перенаправляем на главную для показа модалки подключения компании
    navigate('/');
    // Можно добавить логику показа модалки подключения компании
  };

  // Если viewer и блокировка включена, показываем только модалку (контент скрыт)
  if (role === 'viewer' && blockViewer) {
    return (
      <>
        <div style={{ display: 'none' }}>{children}</div>
        <ViewerRestrictionsModal
          isOpen={showRestrictionsModal}
          onClose={handleCloseModal}
          onConnectCompany={handleConnectCompany}
        />
      </>
    );
  }

  // Если роль не разрешена, показываем только модалку
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <>
        <div style={{ display: 'none' }}>{children}</div>
        <ViewerRestrictionsModal
          isOpen={showRestrictionsModal}
          onClose={handleCloseModal}
          onConnectCompany={handleConnectCompany}
        />
      </>
    );
  }

  // Разрешаем доступ
  return <>{children}</>;
};

