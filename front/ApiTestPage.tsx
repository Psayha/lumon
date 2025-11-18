import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Copy, Bot, RefreshCw, Trash2 } from 'lucide-react';
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
import DebugLogger from '../src/components/DebugLogger';

interface UserContext {
  userId: string;
  role: 'owner' | 'manager' | 'viewer' | null;
  companyId: string | null;
  companyName?: string;
  permissions: string[];
}

const ApiTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('auth-init');
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [chatIdForHistory, setChatIdForHistory] = useState<string>('');
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    endpoint: string;
    timestamp: string;
  } | null>(null);
  const [testAllResults, setTestAllResults] = useState<Array<{
    endpoint: string;
    success: boolean;
    status?: number;
    error?: string;
    timestamp: string;
  }>>([]);
  const [testingAll, setTestingAll] = useState(false);

  // Загружаем сохранённый токен и контекст при монтировании
  useEffect(() => {
    const savedToken = localStorage.getItem('test_session_token');
    const savedContext = localStorage.getItem('test_user_context');
    if (savedToken) {
      setSessionToken(savedToken);
    }
    if (savedContext) {
      try {
        setUserContext(JSON.parse(savedContext));
      } catch (_e) {
        console.error('Failed to parse user context:', _e);
      }
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
    'auth-set-viewer-role': {
      token: sessionToken || 'your-session-token-here'
    },
    'auth-switch-company': {
      token: sessionToken || 'your-session-token-here',
      companyId: ''
    },
    'chat-create': {
      title: 'Test Chat ' + new Date().toLocaleTimeString()
    },
    'chat-save-message': {
      chat_id: '',
      role: 'user',
      content: 'Test message: ' + new Date().toLocaleTimeString()
    },
    'chat-get-history': {},
    'analytics-log-event': {
      action: 'api_test',
      resource: 'api_test_page',
      resource_id: null,
      meta: {
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
      action: 'test_event',
      resource: 'api_test',
      resource_id: null,
      meta: {
        page: 'api-test',
        timestamp: new Date().toISOString()
      }
    }
  };

  const handleLoadTestData = () => {
    const data = testData[selectedEndpoint as keyof typeof testData];
    const dataToLoad = data ? { ...data } : {};
    
    // Автоматически подставляем chat_id для chat-save-message если он есть
    if (selectedEndpoint === 'chat-save-message' && chatIdForHistory && chatIdForHistory.trim() !== '') {
      dataToLoad.chat_id = chatIdForHistory;
    }
    
    setRequestBody(JSON.stringify(dataToLoad, null, 2));
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
      
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      // Валидация и подготовка тела запроса
      let parsedBody: any = {};
      if (method === 'POST') {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          throw new Error('Неверный JSON в теле запроса');
        }

        // Для chat-save-message проверяем chat_id
        if (selectedEndpoint === 'chat-save-message') {
          if (!parsedBody.chat_id || parsedBody.chat_id.trim() === '') {
            // Пробуем использовать chatIdForHistory если он есть
            if (chatIdForHistory && chatIdForHistory.trim() !== '') {
              parsedBody.chat_id = chatIdForHistory;
            } else {
              throw new Error('Требуется chat_id. Сначала создай чат через "chat-create" или укажи chat_id в поле "Chat ID"');
            }
          }
        }

        requestOptions.body = JSON.stringify(parsedBody);
      }

      // Валидация для chat-get-history
      if ((selectedEndpoint === 'get-chat-history' || selectedEndpoint === 'chat-get-history')) {
        if (!chatIdForHistory || chatIdForHistory.trim() === '') {
          throw new Error('Требуется chat_id. Сначала создай чат через "chat-create" или укажи chat_id в поле "Chat ID"');
        }
      }

      // Добавляем Authorization header для защищённых endpoints
      const protectedEndpoints = ['auth-validate', 'auth-refresh', 'auth-logout', 'auth-set-viewer-role', 'auth-switch-company', 'chat-create', 'chat-save-message', 'chat-get-history', 'analytics-log-event'];
      
      // Получаем токен из state или localStorage (fallback)
      const currentToken = sessionToken || localStorage.getItem('session_token') || localStorage.getItem('test_session_token');
      
      if (protectedEndpoints.includes(selectedEndpoint) && currentToken) {
        (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
        
        // Для chat-create добавляем session_token в body (для n8n webhooks)
        if (selectedEndpoint === 'chat-create' && method === 'POST') {
          parsedBody.session_token = currentToken;
          requestOptions.body = JSON.stringify(parsedBody);
          console.log('[ApiTestPage] Added session_token to body for chat-create:', currentToken.substring(0, 20) + '...');
        }
      }

      // Для legacy endpoints используем функции API вместо прямого fetch
      // Это гарантирует использование правильных endpoints и обработку ошибок
      const legacyEndpoints = ['create-chat', 'create-user', 'save-message', 'get-chat-history', 'analytics'];
      const useApiFunction = legacyEndpoints.includes(selectedEndpoint);

      let response: Response;
      let responseText: string;
      
      if (useApiFunction) {
        // Используем функции API для legacy endpoints
        console.log('[API Test] Using API function for legacy endpoint:', selectedEndpoint);
        
        let apiResult: any;
        try {
          switch (selectedEndpoint) {
            case 'create-user': {
              const userData = JSON.parse(requestBody) as User;
              apiResult = await createUser(userData);
              break;
            }
            case 'create-chat': {
              const chatData = JSON.parse(requestBody) as { title?: string };
              apiResult = await createChat(chatData.title);
              break;
            }
            case 'save-message': {
              const messageData = JSON.parse(requestBody) as Message;
              apiResult = await saveMessage(messageData);
              break;
            }
            case 'get-chat-history': {
              if (!chatIdForHistory) {
                throw new Error('Требуется chat_id');
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
          
          // Преобразуем результат API функции в формат ответа
          if (apiResult.success) {
            responseText = JSON.stringify({
              success: true,
              data: apiResult.data
            }, null, 2);
            // Создаем mock Response объект
            response = {
              ok: true,
              status: 200,
              statusText: 'OK',
              text: async () => responseText,
              json: async () => JSON.parse(responseText),
              headers: new Headers(),
            } as Response;
          } else {
            responseText = JSON.stringify({
              success: false,
              error: apiResult.error
            }, null, 2);
            response = {
              ok: false,
              status: 400,
              statusText: 'Bad Request',
              text: async () => responseText,
              json: async () => JSON.parse(responseText),
              headers: new Headers(),
            } as Response;
          }
        } catch (apiError) {
          console.error('[API Test] API function error:', apiError);
          throw apiError;
        }
      } else {
        // Делаем прямой fetch для новых endpoints
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
        
        try {
          response = await fetch(fullUrl, requestOptions);
          responseText = await response.text();
        } catch (fetchError) {
          // Детальная информация об ошибке подключения
          console.error('[API Test] Fetch failed:', fetchError);
          throw new Error(`Failed to connect to ${fullUrl}. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}. Проверь: 1) Доступен ли ${fullUrl}? 2) CORS настроен? 3) nginx проксирует запросы?`);
        }
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
          url: fullUrl || endpoint,
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

      // Автосохранение session_token и context из auth-init
      if (selectedEndpoint === 'auth-init' && response.ok && responseData?.data?.session_token) {
        const token = responseData.data.session_token;
        setSessionToken(token);
        localStorage.setItem('test_session_token', token);
        // Также сохраняем в session_token для совместимости с основным приложением
        localStorage.setItem('session_token', token);
        console.log('[API Test] Session token saved to both test_session_token and session_token');
        
        // Сохраняем user context
        if (responseData.data) {
          const context: UserContext = {
            userId: responseData.data.user?.id || '',
            role: responseData.data.role || null,
            companyId: responseData.data.companyId || null,
            companyName: responseData.data.companyName,
            permissions: []
          };
          setUserContext(context);
          localStorage.setItem('test_user_context', JSON.stringify(context));
          console.log('[API Test] User context saved:', context);
        }
      }
      
      // Сохраняем context из auth-validate, auth-set-viewer-role, auth-switch-company
      if (['auth-validate', 'auth-set-viewer-role', 'auth-switch-company'].includes(selectedEndpoint) && response.ok && responseData?.context) {
        const context: UserContext = {
          userId: responseData.context.userId || '',
          role: responseData.context.role || null,
          companyId: responseData.context.companyId || null,
          companyName: responseData.context.companyName,
          permissions: responseData.context.permissions || []
        };
        setUserContext(context);
        localStorage.setItem('test_user_context', JSON.stringify(context));
        console.log('[API Test] User context updated:', context);
      }

      // Сохраняем chat_id из chat-create или create-chat
      if ((selectedEndpoint === 'chat-create' || selectedEndpoint === 'create-chat') && response.ok && responseData?.data?.id) {
        const newChatId = responseData.data.id;
        setChatIdForHistory(newChatId);
        console.log('[API Test] Chat ID saved:', newChatId);
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
    'auth-set-viewer-role': {
      method: 'POST',
      url: getApiUrl('/webhook/auth-set-viewer-role'),
      description: '👀 Установить роль viewer (для пользователей без компании)',
      requiresAuth: true
    },
    'auth-switch-company': {
      method: 'POST',
      url: getApiUrl('/webhook/auth-switch-company'),
      description: '🔄 Сменить активную компанию (multi-company support)',
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

  const handleClearSession = () => {
    setSessionToken('');
    setUserContext(null);
    localStorage.removeItem('test_session_token');
    localStorage.removeItem('test_user_context');
    setLastTestResult(null);
    setResponse('');
    setTestAllResults([]);
  };

  const handleTestAllEndpoints = async () => {
    setTestingAll(true);
    setTestAllResults([]);
    
    // Основные эндпоинты для тестирования (без legacy)
    const endpointsToTest = [
      'auth-init',
      'auth-validate',
      'auth-refresh',
      'auth-set-viewer-role',
      'auth-switch-company',
      'chat-create',
      'chat-save-message',
      'chat-get-history',
      'analytics-log-event',
      'auth-logout'
    ];

    const results: Array<{
      endpoint: string;
      success: boolean;
      status?: number;
      error?: string;
      timestamp: string;
    }> = [];

    let currentToken = sessionToken;
    let currentChatId = '';

    for (const endpoint of endpointsToTest) {
      const info = endpointInfo[endpoint as keyof typeof endpointInfo];
      if (!info) continue;

      try {
        const sourceData = testData[endpoint as keyof typeof testData];
        const testDataForEndpoint = sourceData ? { ...sourceData } : {};
        
        // Обновляем токен в тестовых данных
        if (['auth-validate', 'auth-refresh', 'auth-logout', 'auth-set-viewer-role', 'auth-switch-company'].includes(endpoint)) {
          testDataForEndpoint.token = currentToken || 'your-session-token-here';
        }

        // Для chat-save-message нужен chat_id
        if (endpoint === 'chat-save-message') {
          if (!currentChatId) {
            results.push({
              endpoint,
              success: false,
              error: 'Требуется chat_id (сначала создай чат)',
              timestamp: new Date().toISOString()
            });
            setTestAllResults([...results]);
            continue;
          }
          testDataForEndpoint.chat_id = currentChatId;
        }

        // Для chat-get-history нужен chat_id
        if (endpoint === 'chat-get-history') {
          if (!currentChatId) {
            results.push({
              endpoint,
              success: false,
              error: 'Требуется chat_id',
              timestamp: new Date().toISOString()
            });
            setTestAllResults([...results]);
            continue;
          }
        }

        const requestOptions: RequestInit = {
          method: info.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        };

        // Добавляем Authorization для защищённых эндпоинтов
        const protectedEndpoints = ['auth-validate', 'auth-refresh', 'auth-logout', 'auth-set-viewer-role', 'auth-switch-company', 'chat-create', 'chat-save-message', 'chat-get-history', 'analytics-log-event'];
        
        // Получаем токен из state или localStorage (fallback)
        const tokenForRequest = currentToken || localStorage.getItem('session_token') || localStorage.getItem('test_session_token');
        
        if (protectedEndpoints.includes(endpoint) && tokenForRequest) {
          (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${tokenForRequest}`;
          
          // Для chat-create добавляем session_token в body (для n8n webhooks)
          if (endpoint === 'chat-create' && info.method === 'POST') {
            testDataForEndpoint.session_token = tokenForRequest;
            console.log('[ApiTestPage] handleTestAll: Added session_token to body for chat-create');
          }
        }

        if (info.method === 'POST') {
          requestOptions.body = JSON.stringify(testDataForEndpoint);
        }

        const fullUrl = endpoint === 'chat-get-history'
          ? `${info.url}?chat_id=${currentChatId}`
          : info.url;

        const response = await fetch(fullUrl, requestOptions);
        const responseText = await response.text();
        
        let responseData: any;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText };
        }

        results.push({
          endpoint,
          success: response.ok,
          status: response.status,
          error: !response.ok ? (responseData.message || responseData.error || `HTTP ${response.status}`) : undefined,
          timestamp: new Date().toISOString()
        });

        // Сохраняем токен из auth-init
        if (endpoint === 'auth-init' && response.ok && responseData?.data?.session_token) {
          currentToken = responseData.data.session_token;
          setSessionToken(currentToken);
          localStorage.setItem('test_session_token', currentToken);
          // Также сохраняем в session_token для совместимости с основным приложением
          localStorage.setItem('session_token', currentToken);
        }

        // Сохраняем chat_id из chat-create
        if (endpoint === 'chat-create' && response.ok && responseData?.data?.id) {
          currentChatId = responseData.data.id;
          setChatIdForHistory(currentChatId);
        }

        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        results.push({
          endpoint,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }

      setTestAllResults([...results]);
    }

    setTestingAll(false);
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Назад</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🧪 API Test
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* Left sidebar - User Context & Status */}
          <div className="lg:col-span-1 space-y-4">
            {/* User Context Card */}
            {userContext ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    👤 Пользователь
                  </h2>
                  <button
                    onClick={handleClearSession}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Очистить сессию"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                      {userContext.userId || 'N/A'}
                    </p>
                  </div>
                  
                  {userContext.role && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Роль</p>
                      <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userContext.role)}`}>
                        {userContext.role}
                      </span>
                        {userContext.role === 'owner' && (
                          <span className="text-xs text-purple-600 dark:text-purple-400" title="Владелец компании">👑</span>
                        )}
                        {userContext.role === 'manager' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400" title="Менеджер">🔧</span>
                        )}
                        {userContext.role === 'viewer' && (
                          <span className="text-xs text-gray-600 dark:text-gray-400" title="Только просмотр">👁️</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {userContext.companyId && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Компания</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                        {userContext.companyName || userContext.companyId}
                      </p>
                    </div>
                  )}
                  
                  {userContext.permissions.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Права</p>
                      <div className="flex flex-wrap gap-1">
                        {userContext.permissions.map((perm, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  👤 Пользователь
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Выполните Auth Init для загрузки данных пользователя
                </p>
              </div>
            )}

            {/* Session Token Status */}
            {sessionToken && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🔑 Session Token
                </h2>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {sessionToken}
                </p>
              </div>
            )}

            {/* Last Test Result */}
            {lastTestResult && (
              <div className={`rounded-xl shadow-sm border p-6 ${
                lastTestResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {lastTestResult.success ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <span className="text-2xl">❌</span>
                  )}
                  <h2 className={`text-lg font-semibold ${
                    lastTestResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}>
                    {lastTestResult.success ? 'Успешно' : 'Ошибка'}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-mono">{lastTestResult.endpoint}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(lastTestResult.timestamp).toLocaleString()}
                </p>
              </div>
            )}

            {/* API Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                ⚙️ Настройки
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">API URL</p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                    {API_CONFIG.baseUrl}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">VITE_API_URL</p>
                  <p className="font-mono text-xs text-gray-900 dark:text-white">
                    {import.meta.env.VITE_API_URL || 'localhost'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">

          {/* Выбор endpoint */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Выбери endpoint:
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => {
                const newEndpoint = e.target.value;
                setSelectedEndpoint(newEndpoint);
                const data = testData[newEndpoint as keyof typeof testData];
                const dataToLoad = data ? { ...data } : {};
                
                // Автоматически подставляем chat_id для chat-save-message если он есть
                if (newEndpoint === 'chat-save-message' && chatIdForHistory && chatIdForHistory.trim() !== '') {
                  dataToLoad.chat_id = chatIdForHistory;
                }
                
                setRequestBody(JSON.stringify(dataToLoad, null, 2));
                setResponse('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="🔐 Auth Endpoints">
                <option value="auth-init">Auth Init - Инициализация сессии (POST)</option>
                <option value="auth-validate">Auth Validate - Проверка токена (POST)</option>
                <option value="auth-refresh">Auth Refresh - Продление сессии (POST)</option>
                <option value="auth-logout">Auth Logout - Выход (POST)</option>
                <option value="auth-set-viewer-role">Auth Set Viewer Role - Установить роль viewer (POST)</option>
                <option value="auth-switch-company">Auth Switch Company - Сменить компанию (POST)</option>
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

          {/* Chat ID для chat-save-message */}
          {selectedEndpoint === 'chat-save-message' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chat ID (будет использован в теле запроса):
              </label>
              <input
                type="text"
                value={chatIdForHistory}
                onChange={(e) => setChatIdForHistory(e.target.value)}
                placeholder="Введите chat_id (UUID) или создай чат через chat-create"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                💡 Chat ID будет автоматически подставлен в запрос, если он не указан в JSON
              </p>
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

              {/* Кнопки тестирования */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestEndpoint}
                  disabled={loading || testingAll || ((selectedEndpoint === 'get-chat-history' || selectedEndpoint === 'chat-get-history') && !chatIdForHistory)}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Отправка...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Тестировать {info.method}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleTestAllEndpoints}
                  disabled={loading || testingAll}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {testingAll ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Тестирую все...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Тестировать все</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ответ */}
            {response && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📄 Ответ
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(response);
                        alert('✅ Ответ скопирован в буфер обмена!');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>JSON</span>
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
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Лог для AI</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <pre className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs overflow-auto max-h-96 border border-gray-200 dark:border-gray-700">
                    {response}
                  </pre>
                </div>
              </div>
            )}

            {/* Результаты тестирования всех эндпоинтов */}
            {testAllResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📊 Результаты тестирования всех эндпоинтов
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      testAllResults.filter(r => r.success).length === testAllResults.length
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {testAllResults.filter(r => r.success).length} / {testAllResults.length} успешно
                    </span>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testAllResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <span className="text-green-600 dark:text-green-400">✅</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">❌</span>
                          )}
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {result.endpoint}
                          </span>
                          {result.status && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              result.status < 300
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : result.status < 400
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {result.status}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {result.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Debug Logger для отладки */}
      <DebugLogger />
    </div>
  );
};

export default ApiTestPage;

