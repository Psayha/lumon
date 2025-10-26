import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot
} from 'lucide-react';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { Header } from '../src/components/Header';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const VoiceAssistantPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [synthesis, setSynthesis] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Инициализация Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'ru-RU';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        // Автоматически отправляем сообщение после распознавания
        setTimeout(() => {
          handleSendMessage(transcript);
        }, 100);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Инициализация Speech Synthesis
    if ('speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis);
    }

    return () => {
      // Cleanup будет обработан в отдельном useEffect
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup effect для recognition
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const handleStartListening = () => {
    if (recognition) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const handleStopListening = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setCurrentMessage('');

    // Имитация ответа AI
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(),
        isUser: false,
        timestamp: new Date()
      };

      setMessages((prev: Message[]) => [...prev, aiResponse]);
      speakText(aiResponse.text);
    }, 1000);
  };

  const generateAIResponse = (): string => {
    const responses = [
      'Понял ваш запрос. Обрабатываю информацию...',
      'Отличная идея! Давайте реализуем это.',
      'Я могу помочь вам с автоматизацией бизнес-процессов.',
      'Создаю workflow для вашей задачи.',
      'Анализирую данные и готовлю отчет.',
      'Настраиваю интеграцию с вашими системами.',
      'Оптимизирую процессы для повышения эффективности.',
      'Готовлю персонализированные рекомендации.'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const speakText = (text: string) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      synthesis.speak(utterance);
    }
  };


  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <Header />
      
      {/* Простой декоративный фон */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>


      {/* Контент */}
      <div className="pt-8 pb-20">
        <div className="min-h-screen flex flex-col">
        {/* Область чата */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md backdrop-blur-sm'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {!message.isUser && (
                      <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.isUser 
                          ? 'text-blue-100' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.isUser && (
                      <div className="p-1 bg-blue-500 rounded-full flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Поле ввода как в мессенджерах - всегда внизу */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              {/* Иконка загрузки файлов */}
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              {/* Поле ввода */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage(currentMessage);
                    }
                  }}
                  placeholder="Введите сообщение"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Кнопка микрофона */}
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`p-2 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              {/* Кнопка отправки */}
              <button
                onClick={() => handleSendMessage(currentMessage)}
                disabled={!currentMessage.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Footer с переключателем тем */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantPage;