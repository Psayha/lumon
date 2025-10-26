import React, { useState } from 'react';
import { AppHeader } from '../src/components/AppHeader';
import { AppFooter } from '../src/components/AppFooter';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';

const VoiceAssistantPage: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  return (
    <div className="h-screen gradient-bg relative overflow-hidden flex flex-col">
      <AppHeader isTyping={isTyping} showHomeButton={false} isListening={isListening} isRecognizing={isRecognizing} />
      
      {/* AI Chat с поддержкой ответов - скроллируемый контент */}
      <div className="flex-1 overflow-hidden">
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