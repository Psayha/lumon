import { useState, useEffect } from 'react';
import { useUserRole } from './useUserRole';
import { getApiUrl, getDefaultHeaders } from '../config/api';
import { logger } from '../lib/logger';

interface GenerationLimit {
  count: number;
  date: string; // YYYY-MM-DD
  userId: string; // Добавлено: отслеживаем userId для сброса при смене пользователя
}

// SECURITY FIX: Fetch limit from backend instead of hardcoding
// Old hardcoded value was 3, now we get it from database
const DEFAULT_VIEWER_DAILY_LIMIT = 1000; // Fallback if API fails

export const useViewerGenerationLimit = () => {
  const { role, context } = useUserRole();
  const [limit, setLimit] = useState<GenerationLimit | null>(null);
  const [remaining, setRemaining] = useState<number>(DEFAULT_VIEWER_DAILY_LIMIT);
  const [backendLimit, setBackendLimit] = useState<number | null>(null);

  // Fetch limit from backend
  useEffect(() => {
    const fetchBackendLimit = async () => {
      if (role !== 'viewer') {
        return;
      }

      try {
        const url = getApiUrl('/webhook/user-limits');
        const response = await fetch(url, {
          method: 'POST',
          headers: getDefaultHeaders(),
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data?.success && data?.data) {
          const dailyRequestsLimit = data.data.find(
            (l: any) => l.limit_type === 'daily_requests'
          );
          if (dailyRequestsLimit) {
            setBackendLimit(dailyRequestsLimit.limit_value);
            logger.log('[useViewerGenerationLimit] Backend limit loaded:', dailyRequestsLimit.limit_value);
          } else {
            // No limit found, use default
            setBackendLimit(DEFAULT_VIEWER_DAILY_LIMIT);
          }
        }
      } catch (error) {
        logger.error('[useViewerGenerationLimit] Failed to fetch backend limit:', error);
        // Use default fallback
        setBackendLimit(DEFAULT_VIEWER_DAILY_LIMIT);
      }
    };

    fetchBackendLimit();
  }, [role]);

  const VIEWER_DAILY_LIMIT = backendLimit ?? DEFAULT_VIEWER_DAILY_LIMIT;

  useEffect(() => {
    const loadLimit = () => {
      if (role !== 'viewer') {
        setRemaining(Infinity);
        return;
      }

      // Wait for backend limit to be loaded
      if (backendLimit === null) {
        return;
      }

      // Получаем текущий userId из контекста
      const currentUserId = context?.userId;
      if (!currentUserId) {
        // Если нет userId, устанавливаем дефолтный лимит
        setRemaining(VIEWER_DAILY_LIMIT);
        return;
      }

      try {
        const saved = localStorage.getItem('viewer_generation_limit');
        const today = new Date().toISOString().split('T')[0];

        if (saved) {
          const parsed: GenerationLimit = JSON.parse(saved);

          // Если userId изменился (пользователь был удален и создан заново), сбрасываем лимиты
          if (parsed.userId && parsed.userId !== currentUserId) {
            console.log('[useViewerGenerationLimit] User ID changed, resetting limits');
            const newLimit: GenerationLimit = { count: 0, date: today, userId: currentUserId };
            localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
            setLimit(newLimit);
            setRemaining(VIEWER_DAILY_LIMIT);
            return;
          }

          // Если дата не сегодня, сбрасываем счётчик
          if (parsed.date !== today) {
            const newLimit: GenerationLimit = { count: 0, date: today, userId: currentUserId };
            localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
            setLimit(newLimit);
            setRemaining(VIEWER_DAILY_LIMIT);
            return;
          }

          setLimit(parsed);
          setRemaining(Math.max(0, VIEWER_DAILY_LIMIT - parsed.count));
        } else {
          // Первый раз - создаём запись
          const newLimit: GenerationLimit = { count: 0, date: today, userId: currentUserId };
          localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
          setLimit(newLimit);
          setRemaining(VIEWER_DAILY_LIMIT);
        }
      } catch (error) {
        console.error('[useViewerGenerationLimit] Ошибка загрузки лимита:', error);
        setRemaining(VIEWER_DAILY_LIMIT);
      }
    };

    loadLimit();
  }, [role, context?.userId, backendLimit]);

  const incrementGeneration = (): boolean => {
    if (role !== 'viewer') {
      return true; // Разрешаем генерацию для не-viewer
    }

    const currentUserId = context?.userId;
    if (!currentUserId) {
      console.warn('[useViewerGenerationLimit] No userId in context');
      return false;
    }

    try {
      const saved = localStorage.getItem('viewer_generation_limit');
      const today = new Date().toISOString().split('T')[0];

      if (saved) {
        const parsed: GenerationLimit = JSON.parse(saved);

        // Если userId изменился, сбрасываем и разрешаем первую генерацию
        if (parsed.userId && parsed.userId !== currentUserId) {
          const newLimit: GenerationLimit = { count: 1, date: today, userId: currentUserId };
          localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
          setLimit(newLimit);
          setRemaining(VIEWER_DAILY_LIMIT - 1);
          return true;
        }

        // Если дата не сегодня, сбрасываем счётчик
        if (parsed.date !== today) {
          const newLimit: GenerationLimit = { count: 1, date: today, userId: currentUserId };
          localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
          setLimit(newLimit);
          setRemaining(VIEWER_DAILY_LIMIT - 1);
          return true;
        }

        // Проверяем лимит
        if (parsed.count >= VIEWER_DAILY_LIMIT) {
          setRemaining(0);
          return false; // Лимит превышен
        }

        // Увеличиваем счётчик
        const newLimit: GenerationLimit = { count: parsed.count + 1, date: today, userId: currentUserId };
        localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
        setLimit(newLimit);
        setRemaining(VIEWER_DAILY_LIMIT - newLimit.count);
        return true;
      } else {
        // Первый раз
        const newLimit: GenerationLimit = { count: 1, date: today, userId: currentUserId };
        localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
        setLimit(newLimit);
        setRemaining(VIEWER_DAILY_LIMIT - 1);
        return true;
      }
    } catch (error) {
      console.error('[useViewerGenerationLimit] Ошибка инкремента:', error);
      return true; // В случае ошибки разрешаем генерацию
    }
  };

  return {
    remaining,
    limit,
    canGenerate: remaining > 0 || role !== 'viewer',
    incrementGeneration,
    isViewer: role === 'viewer'
  };
};

