import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AppHeader } from '../src/components/AppHeader';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';
import {
  saveMessage,
  trackEvent
} from '../src/utils/api';
import { getApiUrl, API_CONFIG } from '../src/config/api';
import { useChatStore } from '../src/store/chatStore';

// VoiceAssistantPage component

const VoiceAssistantPage: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Use Zustand store for chat state
  const chatId = useChatStore((state) => state.chatId);
  const setChatId = useChatStore((state) => state.setChatId);

  // Фиксируем страницу - предотвращаем скролл body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // REMOVED: Auto-create chat on page load
  // Chat will be created automatically on first user message
  // This matches ChatGPT/Claude behavior

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
            onMessageSave={async (message, role, messageId) => {
              console.log('[VoiceAssistantPage] 🔵 onMessageSave called:', {
                role,
                messageLength: message.length,
                messageId,
                chatId,
                hasToken: !!localStorage.getItem('session_token')
              });

              try {
                const token = localStorage.getItem('session_token');

                if (!token) {
                  console.error('[VoiceAssistantPage] ❌ No session token found');
                  toast.error('Session expired. Please log in again.');
                  throw new Error('Session token is required. Please log in again.');
                }

                // Создаем чат при первом сообщении (если еще не создан)
                let currentChatId = chatId;
                if (!currentChatId && role === 'user') {
                  console.log('[VoiceAssistantPage] 🆕 Creating new chat on first message...');
                  
                  try {
                    // Используем первые 50 символов сообщения как название чата
                    const chatTitle = message.substring(0, 50);
                    
                    const response = await fetch(getApiUrl(API_CONFIG.endpoints.chatCreate), {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        title: chatTitle,
                        session_token: token
                      })
                    });

                    if (!response.ok) {
                      throw new Error(`Failed to create chat: ${response.status}`);
                    }

                    const chatData = await response.json();
                    
                    if (!chatData.success || !chatData.data?.id) {
                      throw new Error('Invalid chat creation response');
                    }

                    currentChatId = chatData.data.id;
                    
                    // Важно: обновляем chatId в store СРАЗУ после создания
                    // чтобы AnimatedAIChat получил новый chatId ДО того как 
                    // assistant message попытается сохраниться
                    setChatId(currentChatId);
                    
                    console.log('[VoiceAssistantPage] ✅ Chat created:', currentChatId);

                    await trackEvent({
                      action: 'chat_created',
                      resource: 'chat',
                      resource_id: currentChatId,
                      meta: { source: 'voice_assistant', trigger: 'first_message' },
                    });
                  } catch (createError) {
                    console.error('[VoiceAssistantPage] ❌ Error creating chat:', createError);
                    throw new Error('Failed to create chat. Please try again.');
                  }
                } else if (!currentChatId && role === 'assistant') {
                  // Для assistant message получаем chatId из store
                  // потому что props могут быть устаревшими
                  currentChatId = useChatStore.getState().chatId;
                  console.log('[VoiceAssistantPage] 📥 Got chatId from store for assistant:', currentChatId);
                }

                // Проверяем что чат создан
                if (!currentChatId) {
                  const errorMsg = `Chat ID is required to save ${role} message`;
                  console.error('[VoiceAssistantPage] ❌', errorMsg);
                  throw new Error(errorMsg);
                }

                // Сохраняем сообщение
                console.log('[VoiceAssistantPage] Saving message to chat:', currentChatId);

                await saveMessage({
                  chat_id: currentChatId,
                  role,
                  content: message,
                });

                await trackEvent({
                  action: 'message_sent',
                  resource: 'message',
                  resource_id: currentChatId,
                  meta: {
                    role,
                    message_length: message.length,
                  },
                });

                console.log('[VoiceAssistantPage] ✅ Message saved successfully');
              } catch (error) {
                console.error('[VoiceAssistantPage] ❌ Error saving message:', error);
                const errorMsg = error instanceof Error ? error.message : 'Failed to save message';
                toast.error(errorMsg);
                throw error;
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