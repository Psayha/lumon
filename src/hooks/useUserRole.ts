import { useState, useEffect } from 'react';

export type UserRole = 'owner' | 'manager' | 'viewer' | null;

interface UserContext {
  userId: string;
  role: UserRole;
  companyId: string | null;
  companyName?: string;
  permissions: string[];
}

export const useUserRole = (): { role: UserRole; context: UserContext | null; isLoading: boolean } => {
  const [role, setRole] = useState<UserRole>(null);
  const [context, setContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserContext = () => {
      try {
        const savedContext = localStorage.getItem('user_context');
        if (savedContext) {
          const parsedContext: UserContext = JSON.parse(savedContext);
          setRole(parsedContext.role);
          setContext(parsedContext);
        }
      } catch (error) {
        console.error('[useUserRole] Ошибка загрузки контекста:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserContext();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_context') {
        loadUserContext();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Проверяем изменения каждую секунду (для обновления в том же окне)
    const interval = setInterval(loadUserContext, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return { role, context, isLoading };
};

