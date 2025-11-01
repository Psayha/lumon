import React, { useState, useEffect } from 'react';
import { AppHeader } from '../src/components/AppHeader';
import { AppFooter } from '../src/components/AppFooter';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';

const VoiceAssistantPage: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

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
      {/* Контент занимает весь экран, включая safe-area */}
      <div 
        className="fixed gradient-bg overflow-hidden flex flex-col inset-0"
        style={{
          height: '100dvh'
        }}
      >
        <AppHeader isTyping={isTyping} showHomeButton={false} isListening={isListening} isRecognizing={isRecognizing} />
        
        {/* AI Chat с поддержкой ответов - скроллируемый контент */}
        <div className="flex-1 overflow-hidden min-h-0">
          <AnimatedAIChat 
            onTypingChange={setIsTyping} 
            isListening={isListening}
            onListeningChange={setIsListening}
            isRecognizing={isRecognizing}
            onRecognizingChange={setIsRecognizing}
          />
        </div>

        <AppFooter showHomeButton={true} />
      </div>

      {/* Верхняя safe-area с glass эффектом */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          height: 'var(--safe-top, 0px)'
        }}
      />
      
      {/* Правая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-right, 0px)'
        }}
      />
      
      {/* Нижняя safe-area с glass эффектом */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          height: 'var(--safe-bottom, 0px)'
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