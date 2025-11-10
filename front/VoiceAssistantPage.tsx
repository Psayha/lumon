import React, { useState, useEffect } from 'react';
import { AppHeader } from '../src/components/AppHeader';
// import { AppFooter } from '../src/components/AppFooter';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';
import { 
  saveMessage, 
  trackEvent,
  authInit
} from '../src/utils/api';

const VoiceAssistantPage: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  
  // Backend state
  const [chatId, setChatId] = useState<string | null>(null);

  async function createChatDirect(title: string) {
    const token = localStorage.getItem('session_token');
    if (!token) throw new Error('No session token in localStorage');

    const url = 'https://n8n.psayha.ru/webhook/chat-create?token=' + encodeURIComponent(token);
    const payload = { title, session_token: token };
    
    console.log('[createChatDirect] Request:', { url, hasToken: !!token, title });
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('[createChatDirect] Response:', { status: res.status, statusText: res.statusText, textLength: text.length, textPreview: text.substring(0, 200) });
    
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error('[createChatDirect] Failed to parse JSON:', e, 'Response text:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
    }
    
    if (!res.ok) {
      const errorMsg = json?.message || json?.error || `chat-create HTTP ${res.status}`;
      console.error('[createChatDirect] Error response:', { status: res.status, error: errorMsg, json });
      throw new Error(errorMsg);
    }
    
    if (!json || !json.success) {
      const errorMsg = json?.message || json?.error || 'Invalid response format';
      console.error('[createChatDirect] Invalid success response:', json);
      throw new Error(errorMsg);
    }
    
    console.log('[createChatDirect] Success:', json);
    return json;
  }

  // Фиксируем страницу - предотвращаем скролл body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Инициализируем сессию один раз (если токена нет)
  useEffect(() => {
    if (localStorage.getItem('session_token')) return;
    try {
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      authInit(initData, '1.0.0')
        .then(() => console.log('[VoiceAssistantPage] session initialized'))
        .catch(err => console.error('[VoiceAssistantPage] authInit failed', err));
    } catch (e) { 
      console.error('[VoiceAssistantPage] authInit exception', e); 
    }
  }, []);

  return (
    <>
      {/* Контент занимает весь экран, включая safe-area */}
      <div 
        className="fixed gradient-bg overflow-hidden flex flex-col inset-0"
        style={{
          height: '100dvh'
        }}
      >
        <AppHeader isTyping={isTyping} showHomeButton={false} isListening={isListening} isRecognizing={isRecognizing} />
        
        {/* AI Chat с поддержкой ответов - скроллируемый контент */}
        <div className="flex-1 overflow-hidden min-h-0 pt-[calc(var(--safe-top,0px)+52px)] pb-6">
          <AnimatedAIChat 
            onTypingChange={setIsTyping} 
            isListening={isListening}
            onListeningChange={setIsListening}
            isRecognizing={isRecognizing}
            onRecognizingChange={setIsRecognizing}
            chatId={chatId}
            onChatIdChange={(newChatId) => {
                console.log('[VoiceAssistantPage] onChatIdChange called:', { oldChatId: chatId, newChatId });
                setChatId(newChatId);
            }}
            onMessageSave={async (message, role) => {
              try {
                console.log('[VoiceAssistantPage] onMessageSave called', { message, role, chatId });
                const token = localStorage.getItem('session_token') || '';
                console.log('[Before chat-create]', { hasToken: !!token, tokenStart: token.slice(0, 8) });
                
                if (!token) {
                  console.error('[VoiceAssistantPage] ❌ No session_token found in localStorage');
                  throw new Error('Session token is required. Please log in again.');
                }
                
                // Создаем чат если нет
                if (!chatId) {
                  const chatResponse = await createChatDirect('Voice Assistant Chat');
                  console.log('[VoiceAssistantPage] createChat response:', chatResponse);
                  
                  if (chatResponse.success && chatResponse.data?.id) {
                    const newChatId = chatResponse.data.id;
                    console.log('[VoiceAssistantPage] ✅ Chat created successfully:', newChatId);
                    setChatId(newChatId);
                    
                    // Сохраняем первое сообщение
                    const saveResult = await saveMessage({
                      chat_id: newChatId,
                      role,
                      content: message,
                    });
                    console.log('[VoiceAssistantPage] First message save result:', saveResult);

                    await trackEvent({
                      event_type: 'chat_created',
                      event_data: { chat_id: newChatId },
                    });
                  } else {
                    console.error('[VoiceAssistantPage] ❌ createChat failed:', chatResponse.error);
                    throw new Error(chatResponse.error || 'Failed to create chat');
                  }
                  return;
                }
                
                // Сохраняем сообщение
                console.log('[VoiceAssistantPage] Saving message to existing chat:', chatId);
                const saveResult = await saveMessage({
                  chat_id: chatId,
                  role,
                  content: message,
                });
                console.log('[VoiceAssistantPage] Message save result:', saveResult);
                
                await trackEvent({
                  event_type: 'message_sent',
                  event_data: { 
                    chat_id: chatId,
                    role,
                    message_length: message.length,
                  },
                });
              } catch (error) {
                console.error('[VoiceAssistantPage] ❌ Error saving message:', error);
                // Не пробрасываем ошибку дальше, чтобы не ломать UI
              }
            }}
          />
        </div>

        {/* <AppFooter showHomeButton={true} /> */}
      </div>

      {/* Градиентное размытие сверху с плавным переходом */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] pointer-events-none overflow-hidden"
        style={{
          height: `calc(var(--safe-top, 0px) + 40px)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 bg-white/10 dark:bg-black/10"
          style={{
            height: `calc(var(--safe-top, 0px) + 40px)`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      </div>
      
      {/* Правая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-right, 0px)'
        }}
      />
      
      {/* Левая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-left, 0px)'
        }}
      />
    </>
  );
};

export default VoiceAssistantPage;