import React, { useState, useEffect } from 'react';
import { AppHeader } from '../src/components/AppHeader';
import { 
  createUser, 
  createChat, 
  saveMessage, 
  getChatHistory, 
  trackEvent,
  type User,
  type Message
} from '../src/utils/api';
import { API_CONFIG, getApiUrl } from '../src/config/api';

const ApiTestPage: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('auth-init');
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [chatIdForHistory, setChatIdForHistory] = useState<string>('');
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    endpoint: string;
    timestamp: string;
  } | null>(null);

  // Загружаем сохранённый токен при монтировании
  useEffect(() => {
    const savedToken = localStorage.getItem('test_session_token');
    if (savedToken) {
      setSessionToken(savedToken);
    }
  }, []);

  // Предзаполненные данные для тестирования
  const testData: Record<string, any> = {
    'auth-init': {
      initData: 'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22test_user%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=' + Math.floor(Date.now() / 1000) + '&hash=test_hash',
      appVersion: '1.0.0'
    },
    'auth-validate': {
      token: sessionToken || 'your-session-token-here'
    },
    'auth-refresh': {
      token: sessionToken || 'your-session-token-here'
    },
    'auth-logout': {
      token: sessionToken || 'your-session-token-here'
    },
    'chat-create': {
      title: 'Test Chat ' + new Date().toLocaleTimeString()
    },
    'chat-save-message': {
      chatId: '',
      role: 'user',
      content: 'Test message: ' + new Date().toLocaleTimeString()
    },
    'chat-get-history': {},
    'analytics-log-event': {
      event_type: 'api_test',
      event_data: {
        page: 'api-test',
        timestamp: new Date().toISOString(),
        endpoint: selectedEndpoint
      }
    },
    // Legacy endpoints
    'create-user': {
      telegram_id: 123456789,
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'ru',
      is_premium: false
    },
    'create-chat': {
      user_id: '',
      title: 'Test Chat'
    },
    'save-message': {
      chat_id: '',
      role: 'user',
      content: 'Test message from webapp'
    },
    'get-chat-history': {},
    'analytics': {
      event_type: 'test_event',
      event_data: {
        page: 'api-test',
        timestamp: new Date().toISOString()
      }
    }
  };

  const handleLoadTestData = () => {
    const data = testData[selectedEndpoint as keyof typeof testData];
    setRequestBody(JSON.stringify(data, null, 2));
  };

  const handleTestEndpoint = async () => {
    setLoading(true);
    setResponse('Загрузка...');
    const timestamp = new Date().toISOString();

    // Объявляем переменные в начале функции
    let fullUrl: string = '';
    let method: string = '';

    try {
      // Прямой запрос для детального логирования
      const endpoint = info.url;
      method = info.method;
      
      let requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      // Добавляем Authorization header для защищённых endpoints
      const protectedEndpoints = ['auth-validate', 'auth-refresh', 'auth-logout', 'chat-create', 'chat-save-message', 'chat-get-history', 'analytics-log-event'];
      if (protectedEndpoints.includes(selectedEndpoint) && sessionToken) {
        (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${sessionToken}`;
      }

      if (method === 'POST') {
        requestOptions.body = requestBody;
      }

      // Делаем прямой fetch для детального логирования
      fullUrl = selectedEndpoint === 'get-chat-history' || selectedEndpoint === 'chat-get-history'
        ? `${endpoint}?chat_id=${chatIdForHistory}`
        : endpoint;

      console.log('[API Test] Request:', {
        url: fullUrl,
        method,
        headers: requestOptions.headers,
        body: method === 'POST' ? requestBody : undefined,
        timestamp
      });

      let response: Response;
      let responseText: string;
      
      try {
        response = await fetch(fullUrl, requestOptions);
        responseText = await response.text();
      } catch (fetchError) {
        // Детальная информация об ошибке подключения
        console.error('[API Test] Fetch failed:', fetchError);
        throw new Error(`Failed to connect to ${fullUrl}. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}. Проверь: 1) Доступен ли ${fullUrl}? 2) CORS настроен? 3) nginx проксирует запросы?`);
      }
      
      console.log('[API Test] Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      const result = {
        timestamp,
        endpoint: selectedEndpoint,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? responseData : undefined,
        error: !response.ok ? (responseData.message || responseData.error || responseText || `HTTP ${response.status}`) : undefined,
        fullResponse: responseData,
        request: {
          url: fullUrl,
          method,
          headers: requestOptions.headers,
          body: method === 'POST' ? JSON.parse(requestBody) : undefined
        }
      };

      setResponse(JSON.stringify(result, null, 2));
      setLastTestResult({
        success: response.ok,
        endpoint: selectedEndpoint,
        timestamp
      });

      // Автосохранение session_token из auth-init
      if (selectedEndpoint === 'auth-init' && response.ok && responseData?.data?.session_token) {
        const token = responseData.data.session_token;
        setSessionToken(token);
        localStorage.setItem('test_session_token', token);
        console.log('[API Test] Session token saved:', token);
      }

      // Также пробуем через обычные функции API для сравнения
      let apiResult: any;
      try {
        switch (selectedEndpoint) {
          case 'create-user': {
            const userData = JSON.parse(requestBody) as User;
            apiResult = await createUser(userData);
            break;
          }
          case 'create-chat': {
            const chatData = JSON.parse(requestBody) as { user_id: string; title?: string };
            apiResult = await createChat(chatData.user_id, chatData.title);
            break;
          }
          case 'save-message': {
            const messageData = JSON.parse(requestBody) as Message;
            apiResult = await saveMessage(messageData);
            break;
          }
          case 'get-chat-history': {
            if (!chatIdForHistory) {
              break;
            }
            apiResult = await getChatHistory(chatIdForHistory);
            break;
          }
          case 'analytics': {
            const analyticsData = JSON.parse(requestBody);
            apiResult = await trackEvent(analyticsData);
            break;
          }
        }
        
        if (apiResult) {
          console.log('[API Test] API Function Result:', apiResult);
        }
      } catch (apiError) {
        console.error('[API Test] API Function Error:', apiError);
      }

    } catch (error) {
      console.error('[API Test] Fetch Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Дополнительная диагностика
      const diagnostics = {
        requestedUrl: fullUrl || 'не определен',
        method: method || 'не определен',
        currentDomain: window.location.origin,
        userAgent: navigator.userAgent.substring(0, 100),
        timestamp: new Date().toISOString()
      };
      
      setResponse(JSON.stringify({
        success: false,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        diagnostics,
        troubleshooting: {
          step1: `Проверь доступность: curl ${fullUrl || 'URL'}`,
          step2: 'Проверь CORS настройки в nginx для n8n.psayha.ru',
          step3: 'Проверь что n8n контейнер запущен: docker ps | grep n8n',
          step4: 'Проверь nginx конфиг: sudo nginx -t',
          step5: 'Проверь логи n8n: docker compose logs n8n'
        },
        stack: error instanceof Error ? error.stack : undefined
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const endpointInfo: Record<string, { method: string; url: string; description: string; requiresAuth?: boolean }> = {
    // Auth endpoints
    'auth-init': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.authInit),
      description: '🔐 Инициализация сессии (Telegram initData → session_token)'
    },
    'auth-validate': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.authValidate),
      description: '✅ Валидация токена (возвращает context: userId, role, companyId)',
      requiresAuth: true
    },
    'auth-refresh': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.authRefresh),
      description: '🔄 Продление сессии (обновляет expires_at)',
      requiresAuth: true
    },
    'auth-logout': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.authLogout),
      description: '🚪 Выход (удаляет сессию)',
      requiresAuth: true
    },
    // Chat endpoints
    'chat-create': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.chatCreate),
      description: '💬 Создание чата (требует авторизацию)',
      requiresAuth: true
    },
    'chat-save-message': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.chatSaveMessage),
      description: '📝 Сохранение сообщения (требует авторизацию)',
      requiresAuth: true
    },
    'chat-get-history': {
      method: 'GET',
      url: getApiUrl(API_CONFIG.endpoints.chatGetHistory),
      description: '📜 История чата (требует авторизацию)',
      requiresAuth: true
    },
    // Analytics
    'analytics-log-event': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.analyticsLogEvent),
      description: '📊 Логирование события (требует авторизацию)',
      requiresAuth: true
    },
    // Legacy endpoints
    'create-user': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.createUser),
      description: '[Legacy] Создает или обновляет пользователя'
    },
    'create-chat': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.createChat),
      description: '[Legacy] Создает новый чат для пользователя'
    },
    'save-message': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.saveMessage),
      description: '[Legacy] Сохраняет сообщение в чат'
    },
    'get-chat-history': {
      method: 'GET',
      url: getApiUrl(API_CONFIG.endpoints.getChatHistory),
      description: '[Legacy] Получает историю сообщений чата'
    },
    'analytics': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.trackEvent),
      description: '[Legacy] Отправляет аналитическое событие'
    }
  };

  const info = endpointInfo[selectedEndpoint as keyof typeof endpointInfo];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader showHomeButton={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            🧪 Тестирование API
          </h1>

          {/* Информация о текущем API */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>API URL:</strong> {API_CONFIG.baseUrl}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
              <strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'не установлен (используется localhost)'}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
              ⚠️ Если видишь localhost в продакшене — нужно пересобрать фронтенд с VITE_API_URL
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Открой консоль (F12) для детального логирования запросов
            </p>
          </div>

          {/* Session Token индикатор */}
          {sessionToken && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                    🔑 Session Token активен
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                    {sessionToken.substring(0, 40)}...
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSessionToken('');
                    localStorage.removeItem('test_session_token');
                  }}
                  className="ml-4 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  Очистить
                </button>
              </div>
            </div>
          )}

          {/* Last Test Result */}
          {lastTestResult && (
            <div className={`mb-4 p-4 rounded-lg border ${
              lastTestResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            }`}>
              <p className={`text-sm font-medium ${
                lastTestResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
              }`}>
                {lastTestResult.success ? '✅ Последний тест успешен' : '❌ Последний тест провален'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Endpoint: <span className="font-mono">{lastTestResult.endpoint}</span> | 
                Время: {new Date(lastTestResult.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Выбор endpoint */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Выбери endpoint:
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => {
                setSelectedEndpoint(e.target.value);
                setRequestBody(JSON.stringify(testData[e.target.value as keyof typeof testData] || {}, null, 2));
                setResponse('');
                setChatIdForHistory('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="🔐 Auth Endpoints">
                <option value="auth-init">Auth Init - Инициализация сессии (POST)</option>
                <option value="auth-validate">Auth Validate - Проверка токена (POST)</option>
                <option value="auth-refresh">Auth Refresh - Продление сессии (POST)</option>
                <option value="auth-logout">Auth Logout - Выход (POST)</option>
              </optgroup>
              <optgroup label="💬 Chat Endpoints">
                <option value="chat-create">Chat Create - Создание чата (POST)</option>
                <option value="chat-save-message">Chat Save Message - Сохранение сообщения (POST)</option>
                <option value="chat-get-history">Chat Get History - История чата (GET)</option>
              </optgroup>
              <optgroup label="📊 Analytics">
                <option value="analytics-log-event">Analytics Log Event - Логирование (POST)</option>
              </optgroup>
              <optgroup label="📦 Legacy Endpoints">
                <option value="create-user">[Legacy] Create User (POST)</option>
                <option value="create-chat">[Legacy] Create Chat (POST)</option>
                <option value="save-message">[Legacy] Save Message (POST)</option>
                <option value="get-chat-history">[Legacy] Get Chat History (GET)</option>
                <option value="analytics">[Legacy] Analytics (POST)</option>
              </optgroup>
            </select>
          </div>

          {/* Информация о выбранном endpoint */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>Метод:</strong> {info.method}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>URL:</strong> <code className="text-xs">{info.url}</code>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Описание:</strong> {info.description}
            </p>
          </div>

          {/* GET параметр для get-chat-history */}
          {selectedEndpoint === 'get-chat-history' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chat ID (query parameter):
              </label>
              <input
                type="text"
                value={chatIdForHistory}
                onChange={(e) => setChatIdForHistory(e.target.value)}
                placeholder="Введите chat_id (UUID)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Тело запроса (для POST) */}
          {info.method === 'POST' && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Тело запроса (JSON):
                </label>
                <button
                  onClick={handleLoadTestData}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Загрузить тестовые данные
                </button>
              </div>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          {/* Кнопка тестирования */}
          <button
            onClick={handleTestEndpoint}
            disabled={loading || (selectedEndpoint === 'get-chat-history' && !chatIdForHistory)}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Отправка запроса...' : `🚀 Тестировать ${info.method}`}
          </button>

          {/* Ответ */}
          {response && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ответ:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(response);
                      alert('✅ Ответ скопирован в буфер обмена!');
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    📋 Копировать JSON
                  </button>
                  <button
                    onClick={() => {
                      const logData = JSON.parse(response);
                      const aiLog = `
=== API Test Log для AI ===
Timestamp: ${logData.timestamp}
Endpoint: ${logData.endpoint}
Status: ${logData.success ? '✅ SUCCESS' : '❌ FAILED'}

REQUEST:
  Method: ${logData.request.method}
  URL: ${logData.request.url}
  Headers: ${JSON.stringify(logData.request.headers, null, 2)}
  ${logData.request.body ? `Body: ${JSON.stringify(logData.request.body, null, 2)}` : ''}

RESPONSE:
  Status: ${logData.status} ${logData.statusText}
  ${logData.data ? `Data: ${JSON.stringify(logData.data, null, 2)}` : ''}
  ${logData.error ? `Error: ${logData.error}` : ''}

FULL RESPONSE:
${JSON.stringify(logData.fullResponse, null, 2)}
===========================
                      `.trim();
                      navigator.clipboard.writeText(aiLog);
                      alert('🤖 Лог для AI скопирован! Теперь можешь отправить его мне.');
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors font-medium"
                  >
                    🤖 Копировать лог для AI
                  </button>
                </div>
              </div>
              <div className="relative">
                <pre className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm overflow-auto max-h-96">
                  {response}
                </pre>
              </div>
            </div>
          )}

          {/* Инструкция */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">📝 Инструкция по использованию:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li><strong>Начни с Auth Init:</strong> Сначала протестируй "Auth Init" чтобы получить session_token</li>
              <li><strong>Выбери endpoint:</strong> После получения токена можешь тестировать защищённые endpoints</li>
              <li><strong>Загрузи тестовые данные:</strong> Нажми "Загрузить тестовые данные" для автозаполнения</li>
              <li><strong>Проверь результат:</strong> Смотри на индикаторы ✅/❌ сверху</li>
              <li><strong>Скопируй лог для AI:</strong> Если нужна помощь - нажми "🤖 Копировать лог для AI" и отправь мне</li>
              <li><strong>DevTools:</strong> Открой консоль (F12 → Network) для детального анализа запросов</li>
            </ol>
          </div>

          {/* Roadmap ссылка */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">📚 Документация:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Полная информация о новой архитектуре авторизации в файле:
            </p>
            <a 
              href="/ROADMAP_AUTH.md" 
              target="_blank"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              → ROADMAP_AUTH.md
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;

