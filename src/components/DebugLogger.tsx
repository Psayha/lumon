import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Trash2, Copy, Check } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  data?: any;
}

const DebugLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [maxLogs] = useState(100);
  const logIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Состояние для перетаскивания
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('debugLoggerPosition');
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved);
        return { x, y };
      } catch {
        return { x: 16, y: 16 };
      }
    }
    return { x: 16, y: 16 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Перехватываем console.log, console.warn, console.error, console.info, console.debug
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    const addLog = (level: LogEntry['level'], ...args: any[]) => {
      const message = args
        .map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      const logEntry: LogEntry = {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        level,
        message,
        data: args.length > 1 ? args : undefined,
      };

      setLogs(prev => {
        const newLogs = [logEntry, ...prev].slice(0, maxLogs);
        return newLogs;
      });
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      addLog('error', ...args);
    };

    console.info = (...args: any[]) => {
      originalInfo(...args);
      addLog('info', ...args);
    };

    console.debug = (...args: any[]) => {
      originalDebug(...args);
      addLog('log', ...args);
    };

    // Перехватываем fetch запросы
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlString = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url;
      const options = init || {};
      const method = options.method || 'GET';
      const startTime = Date.now();
      
      // Логируем запрос
      const requestInfo = {
        method,
        url: urlString,
        headers: options.headers ? (options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : options.headers) : {},
        hasBody: !!options.body,
        bodyPreview: options.body ? (typeof options.body === 'string' ? options.body.substring(0, 200) : '[...]') : undefined
      };
      
      addLog('info', `[FETCH] ${method} ${requestInfo.url}`, requestInfo);

      try {
        const response = await originalFetch(input, init);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Клонируем response для чтения body (оригинальный response остается нетронутым)
        let responseBody = null;
        
        try {
          const clonedResponse = response.clone();
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              responseBody = await clonedResponse.json();
            } catch {
              // Если JSON парсинг не удался, пробуем как текст
              const text = await clonedResponse.text();
              responseBody = text.substring(0, 500);
            }
          } else {
            const text = await clonedResponse.text();
            responseBody = text.substring(0, 500);
          }
        } catch (e) {
          // Игнорируем ошибки парсинга body (возможно response уже был прочитан)
          responseBody = '[Unable to read response body]';
        }

        // Логируем ответ
        const responseInfo = {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody
        };
        
        const logLevel = response.ok ? 'info' : 'error';
        addLog(logLevel, `[FETCH] ${method} ${urlString} → ${response.status} (${duration}ms)`, responseInfo);

        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        addLog('error', `[FETCH] ${method} ${urlString} → ERROR (${duration}ms)`, error);
        throw error;
      }
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
      console.debug = originalDebug;
      window.fetch = originalFetch;
    };
  }, [maxLogs]);

  // Автоскролл к новым логам
  useEffect(() => {
    if (containerRef.current && !isMinimized) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs, isMinimized]);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = async () => {
    try {
      const logsText = logs
        .map(log => {
          const level = log.level.toUpperCase().padEnd(5);
          return `[${log.timestamp}] ${level}: ${log.message}`;
        })
        .join('\n');

      await navigator.clipboard.writeText(logsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = logs
        .map(log => {
          const level = log.level.toUpperCase().padEnd(5);
          return `[${log.timestamp}] ${level}: ${log.message}`;
        })
        .join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Обработчики перетаскивания
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerElementRef.current) {
      const rect = containerElementRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerElementRef.current) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Ограничиваем позицию в пределах экрана
        const maxX = window.innerWidth - (containerElementRef.current.offsetWidth || 384);
        const maxY = window.innerHeight - (containerElementRef.current.offsetHeight || 200);
        
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        setPosition({ x: clampedX, y: clampedY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Сохраняем позицию в localStorage
        localStorage.setItem('debugLoggerPosition', JSON.stringify(position));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <div 
      ref={containerElementRef}
      className="fixed z-50 w-96 max-w-[calc(100vw-2rem)]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[600px]">
        {/* Заголовок - область для перетаскивания */}
        <div 
          className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Debug Logger</span>
            {errorCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {errorCount} ошибок
              </span>
            )}
            {warnCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {warnCount} предупреждений
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyLogs}
              className={`p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors ${
                copied ? 'bg-green-100 dark:bg-green-900/30' : ''
              }`}
              aria-label="Копировать логи"
              title="Копировать все логи"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={clearLogs}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Очистить логи"
              title="Очистить логи"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label={isMinimized ? 'Развернуть' : 'Свернуть'}
              title={isMinimized ? 'Развернуть' : 'Свернуть'}
            >
              {isMinimized ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Список логов */}
        {!isMinimized && (
          <div
            ref={containerRef}
            className="overflow-y-auto flex-1 p-2 space-y-1 text-xs font-mono"
            style={{ maxHeight: '500px' }}
          >
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Логи отсутствуют
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`p-2 rounded border-l-2 ${
                    log.level === 'error'
                      ? 'border-red-500'
                      : log.level === 'warn'
                      ? 'border-yellow-500'
                      : log.level === 'info'
                      ? 'border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <span className="font-semibold text-[10px] uppercase flex-shrink-0">
                      {log.level}:
                    </span>
                    <div className="flex-1 break-words">
                      <div className="whitespace-pre-wrap break-all">{log.message}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Статистика при свернутом виде */}
        {isMinimized && (
          <div className="p-2 text-xs text-gray-600 dark:text-gray-400 text-center">
            {logs.length} записей • {errorCount} ошибок • {warnCount} предупреждений
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugLogger;

