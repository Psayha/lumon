import { useState, useEffect } from 'react';
import { useUserRole } from './useUserRole';

interface GenerationLimit {
  count: number;
  date: string; // YYYY-MM-DD
}

const VIEWER_DAILY_LIMIT = 3;

export const useViewerGenerationLimit = () => {
  const { role } = useUserRole();
  const [limit, setLimit] = useState<GenerationLimit | null>(null);
  const [remaining, setRemaining] = useState<number>(VIEWER_DAILY_LIMIT);

  useEffect(() => {
    const loadLimit = () => {
      if (role !== 'viewer') {
        setRemaining(Infinity);
        return;
      }

      try {
        const saved = localStorage.getItem('viewer_generation_limit');
        if (saved) {
          const parsed: GenerationLimit = JSON.parse(saved);
          const today = new Date().toISOString().split('T')[0];
          
          // Если дата не сегодня, сбрасываем счётчик
          if (parsed.date !== today) {
            const newLimit: GenerationLimit = { count: 0, date: today };
            localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
            setLimit(newLimit);
            setRemaining(VIEWER_DAILY_LIMIT);
            return;
          }
          
          setLimit(parsed);
          setRemaining(Math.max(0, VIEWER_DAILY_LIMIT - parsed.count));
        } else {
          // Первый раз - создаём запись
          const today = new Date().toISOString().split('T')[0];
          const newLimit: GenerationLimit = { count: 0, date: today };
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
  }, [role]);

  const incrementGeneration = (): boolean => {
    if (role !== 'viewer') {
      return true; // Разрешаем генерацию для не-viewer
    }

    try {
      const saved = localStorage.getItem('viewer_generation_limit');
      const today = new Date().toISOString().split('T')[0];
      
      if (saved) {
        const parsed: GenerationLimit = JSON.parse(saved);
        
        // Если дата не сегодня, сбрасываем счётчик
        if (parsed.date !== today) {
          const newLimit: GenerationLimit = { count: 1, date: today };
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
        const newLimit: GenerationLimit = { count: parsed.count + 1, date: today };
        localStorage.setItem('viewer_generation_limit', JSON.stringify(newLimit));
        setLimit(newLimit);
        setRemaining(VIEWER_DAILY_LIMIT - newLimit.count);
        return true;
      } else {
        // Первый раз
        const newLimit: GenerationLimit = { count: 1, date: today };
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

