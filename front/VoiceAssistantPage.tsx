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
  const isCreatingChat = useChatStore((state) => state.isCreatingChat);
  const setChatCreating = useChatStore((state) => state.setChatCreating);
  const setChatCreated = useChatStore((state) => state.setChatCreated);
  const setChatCreationError = useChatStore((state) => state.setChatCreationError);

  // Функция создания чата
  async function createChatDirect(title: string) {
    const token = localStorage.getItem('session_token');
    if (!token) {
      throw new Error('No session token in localStorage');
    }

    const url = getApiUrl(API_CONFIG.endpoints.chatCreate);

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

                // RACE CONDITION FIX: Check if chat is being created
                if (!chatId) {
                  // If chat is already being created, wait for it
                  if (isCreatingChat) {
                    console.log('[VoiceAssistantPage] ⏳ Chat is being created, waiting...');
                    toast.info('Please wait, chat is being created...');

                    // Wait for chat creation to complete (poll every 100ms)
                    const maxWaitTime = 10000; // 10 seconds max
                    const startTime = Date.now();

                    while (isCreatingChat && Date.now() - startTime < maxWaitTime) {
                      await new Promise(resolve => setTimeout(resolve, 100));
                      // Get fresh state
                      const currentChatId = useChatStore.getState().chatId;
                      const currentIsCreating = useChatStore.getState().isCreatingChat;

                      if (currentChatId) {
                        // Chat created! Save message to it
                        console.log('[VoiceAssistantPage] ✅ Chat created during wait, saving message');
                        const toastId = toast.loading('Saving message...');

                        await saveMessage({
                          chat_id: currentChatId,
                          role,
                          content: message,
                        });

                        toast.success('Message saved', { id: toastId });
                        return;
                      }

                      if (!currentIsCreating) {
                        // Creation failed or completed without chatId
                        throw new Error('Chat creation failed');
                      }
                    }

                    throw new Error('Chat creation timeout');
                  }

                  // Create new chat
                  console.log('[VoiceAssistantPage] Creating new chat...');
                  setChatCreating();

                  const toastId = toast.loading('Creating chat...');

                  try {
                    const chatResponse = await createChatDirect('Voice Assistant Chat');

                    if (chatResponse.success && chatResponse.data?.id) {
                      const newChatId = chatResponse.data.id;
                      setChatCreated(newChatId);

                      // Сохраняем первое сообщение
                      toast.loading('Saving message...', { id: toastId });
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

                      toast.success('Chat created!', { id: toastId });
                      console.log('[VoiceAssistantPage] ✅ Chat created and message saved:', newChatId);
                    } else {
                      throw new Error(chatResponse.error || 'Failed to create chat');
                    }
                  } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Failed to create chat';
                    setChatCreationError(errorMsg);
                    toast.error(errorMsg, { id: toastId });
                    throw error;
                  }
                  return;
                }

                // Сохраняем сообщение в существующий чат
                console.log('[VoiceAssistantPage] Saving message to chat:', chatId);

                const toastId = toast.loading('Saving message...');

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

                toast.success('Message saved', { id: toastId });
                console.log('[VoiceAssistantPage] ✅ Message saved successfully');
              } catch (error) {
                console.error('[VoiceAssistantPage] ❌ Error saving message:', error);
                const errorMsg = error instanceof Error ? error.message : 'Failed to save message';
                toast.error(errorMsg);
                // Re-throw to let the component handle it if needed
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