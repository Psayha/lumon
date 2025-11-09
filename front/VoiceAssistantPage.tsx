import React, { useState, useEffect } from 'react';
import { AppHeader } from '../src/components/AppHeader';
// import { AppFooter } from '../src/components/AppFooter';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';
import { 
  createChat, 
  saveMessage, 
  trackEvent
} from '../src/utils/api';

const VoiceAssistantPage: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  
  // Backend state
  const [chatId, setChatId] = useState<string | null>(null);

  // Фиксируем страницу - предотвращаем скролл body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Chat инициализация при первом сообщении

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
            onChatIdChange={setChatId}
            onMessageSave={async (message, role) => {
              try {
                console.log('[VoiceAssistantPage] onMessageSave called', { message, role, chatId });
                
                // Создаем чат если нет
                if (!chatId) {
                  console.log('[VoiceAssistantPage] No chatId, calling createChat...');
                  const chatResponse = await createChat('Voice Assistant Chat');
                  console.log('[VoiceAssistantPage] createChat response:', chatResponse);
                  
                  if (chatResponse.success && chatResponse.data?.id) {
                    setChatId(chatResponse.data.id);
                    
                    // Сохраняем первое сообщение
                    await saveMessage({
                      chat_id: chatResponse.data.id,
                      role,
                      content: message,
                    });

                    await trackEvent({
                      event_type: 'chat_created',
                      event_data: { chat_id: chatResponse.data.id },
                    });
                  } else {
                    console.error('[VoiceAssistantPage] createChat failed:', chatResponse.error);
                  }
                  return;
                }
                
                // Сохраняем сообщение
                await saveMessage({
                  chat_id: chatId,
                  role,
                  content: message,
                });
                
                await trackEvent({
                  event_type: 'message_sent',
                  event_data: { 
                    chat_id: chatId,
                    role,
                    message_length: message.length,
                  },
                });
              } catch (error) {
                console.error('[VoiceAssistantPage] Error saving message:', error);
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