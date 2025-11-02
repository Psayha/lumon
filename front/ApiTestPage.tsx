import React, { useState } from 'react';
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
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('create-user');
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chatIdForHistory, setChatIdForHistory] = useState<string>('');

  // Предзаполненные данные для тестирования
  const testData = {
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

    try {
      // Прямой запрос для детального логирования
      const endpoint = info.url;
      const method = info.method;
      
      let requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (method === 'POST') {
        requestOptions.body = requestBody;
      }

      // Делаем прямой fetch для детального логирования
      const fullUrl = selectedEndpoint === 'get-chat-history' 
        ? `${endpoint}?chat_id=${chatIdForHistory}`
        : endpoint;

      console.log('[API Test] Request:', {
        url: fullUrl,
        method,
        headers: requestOptions.headers,
        body: method === 'POST' ? requestBody : undefined
      });

      const response = await fetch(fullUrl, requestOptions);
      const responseText = await response.text();
      
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
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? responseData : undefined,
        error: !response.ok ? (responseData.message || responseData.error || responseText || `HTTP ${response.status}`) : undefined,
        fullResponse: responseData,
        request: {
          url: fullUrl,
          method,
          body: method === 'POST' ? JSON.parse(requestBody) : undefined
        }
      };

      setResponse(JSON.stringify(result, null, 2));

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
      setResponse(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        message: error instanceof Error ? error.message : String(error)
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const endpointInfo = {
    'create-user': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.createUser),
      description: 'Создает или обновляет пользователя'
    },
    'create-chat': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.createChat),
      description: 'Создает новый чат для пользователя'
    },
    'save-message': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.saveMessage),
      description: 'Сохраняет сообщение в чат'
    },
    'get-chat-history': {
      method: 'GET',
      url: getApiUrl(API_CONFIG.endpoints.getChatHistory),
      description: 'Получает историю сообщений чата'
    },
    'analytics': {
      method: 'POST',
      url: getApiUrl(API_CONFIG.endpoints.trackEvent),
      description: 'Отправляет аналитическое событие'
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
              <option value="create-user">Create User (POST)</option>
              <option value="create-chat">Create Chat (POST)</option>
              <option value="save-message">Save Message (POST)</option>
              <option value="get-chat-history">Get Chat History (GET)</option>
              <option value="analytics">Analytics (POST)</option>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ответ:
              </label>
              <div className="relative">
                <pre className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm overflow-auto max-h-96">
                  {response}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(response);
                    alert('Ответ скопирован!');
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  📋 Копировать
                </button>
              </div>
            </div>
          )}

          {/* Инструкция */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">📝 Инструкция:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Выбери endpoint для тестирования</li>
              <li>Для POST endpoints - заполни тело запроса или нажми "Загрузить тестовые данные"</li>
              <li>Для GET endpoints - введи необходимые параметры</li>
              <li>Нажми "Тестировать" и посмотри ответ</li>
              <li>Проверь логи в DevTools (F12 → Network) для деталей запроса</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;

