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
    <div 
      className="fixed gradient-bg overflow-hidden flex flex-col"
      style={{
        top: 'var(--safe-top, 0px)',
        right: 'var(--safe-right, 0px)',
        bottom: 'var(--safe-bottom, 0px)',
        left: 'var(--safe-left, 0px)',
        height: 'calc(100dvh - var(--safe-top, 0px) - var(--safe-bottom, 0px))'
      }}
    >
      {/* Верхняя safe-area с размытием */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md bg-white/80 dark:bg-gray-900/80"
        style={{
          height: 'var(--safe-top, 0px)'
        }}
      />
      
      {/* Правая safe-area с размытием */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[100] backdrop-blur-md bg-white/80 dark:bg-gray-900/80"
        style={{
          width: 'var(--safe-right, 0px)'
        }}
      />
      
      {/* Нижняя safe-area с размытием */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-md bg-white/80 dark:bg-gray-900/80"
        style={{
          height: 'var(--safe-bottom, 0px)'
        }}
      />
      
      {/* Левая safe-area с размытием */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-[100] backdrop-blur-md bg-white/80 dark:bg-gray-900/80"
        style={{
          width: 'var(--safe-left, 0px)'
        }}
      />
      
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
  );
};

export default VoiceAssistantPage;