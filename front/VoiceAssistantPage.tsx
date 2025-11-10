import React, { useState, useEffect } from 'react';
import { AppHeader } from '../src/components/AppHeader';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';
import { 
  saveMessage, 
  trackEvent
} from '../src/utils/api';

// VoiceAssistantPage component

const VoiceAssistantPage: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  // Функция создания чата
  async function createChatDirect(title: string) {
    const token = localStorage.getItem('session_token');
    if (!token) {
      throw new Error('No session token in localStorage');
    }

    const url = 'https://n8n.psayha.ru/webhook/chat-create';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title,
        session_token: token
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[createChatDirect] Error:', { 
        status: response.status, 
        errorText 
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[createChatDirect] Success:', data);
    
    if (!data.success || !data.data?.id) {
      throw new Error(data.message || 'Invalid response format');
    }
    
    return data;
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

  return (
    <>
      <div 
        className="fixed gradient-bg overflow-hidden flex flex-col inset-0"
        style={{
          height: '100dvh'
        }}
      >
        <AppHeader 
          isTyping={isTyping} 
          showHomeButton={false} 
          isListening={isListening} 
          isRecognizing={isRecognizing} 
        />
        
        <div className="flex-1 overflow-hidden min-h-0 pt-[calc(var(--safe-top,0px)+52px)] pb-6">
          <AnimatedAIChat 
            onTypingChange={setIsTyping} 
            isListening={isListening}
            onListeningChange={setIsListening}
            isRecognizing={isRecognizing}
            onRecognizingChange={setIsRecognizing}
            chatId={chatId}
            onChatIdChange={(newChatId) => {
              console.log('[VoiceAssistantPage] Chat ID changed:', newChatId);
              setChatId(newChatId);
            }}
            onMessageSave={async (message, role) => {
              console.log('[VoiceAssistantPage] 🔵 onMessageSave called:', { 
                role, 
                messageLength: message.length,
                chatId,
                hasToken: !!localStorage.getItem('session_token')
              });

              try {
                const token = localStorage.getItem('session_token');
                
                if (!token) {
                  console.error('[VoiceAssistantPage] ❌ No session token found');
                  throw new Error('Session token is required. Please log in again.');
                }

                // Создаем чат если нужно
                if (!chatId) {
                  console.log('[VoiceAssistantPage] Creating new chat...');
                  
                  const chatResponse = await createChatDirect('Voice Assistant Chat');
                  
                  if (chatResponse.success && chatResponse.data?.id) {
                    const newChatId = chatResponse.data.id;
                    setChatId(newChatId);
                    
                    // Сохраняем первое сообщение
                    await saveMessage({
                      chat_id: newChatId,
                      role,
                      content: message,
                    });

                    await trackEvent({
                      action: 'chat_created',
                      resource: 'chat',
                      resource_id: newChatId,
                      meta: { source: 'voice_assistant' },
                    });
                    
                    console.log('[VoiceAssistantPage] ✅ Chat created and message saved:', newChatId);
                  } else {
                    throw new Error(chatResponse.error || 'Failed to create chat');
                  }
                  return;
                }
                
                // Сохраняем сообщение в существующий чат
                console.log('[VoiceAssistantPage] Saving message to chat:', chatId);
                await saveMessage({
                  chat_id: chatId,
                  role,
                  content: message,
                });
                
                await trackEvent({
                  action: 'message_sent',
                  resource: 'message',
                  resource_id: chatId,
                  meta: {
                    role,
                    message_length: message.length,
                  },
                });
                
                console.log('[VoiceAssistantPage] ✅ Message saved successfully');
              } catch (error) {
                console.error('[VoiceAssistantPage] ❌ Error saving message:', error);
                // Не пробрасываем ошибку дальше, чтобы не ломать UI
              }
            }}
          />
        </div>
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