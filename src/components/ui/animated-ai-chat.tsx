import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
    FileText,
    BarChart3,
    MessageSquare,
    CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";
import { MessageList } from "./MessageList";
import { WelcomeMessage } from "./WelcomeMessage";
import { QuickCommands } from "./QuickCommands";
import { InputArea } from "./InputArea";
import { ChatHistory } from "./ChatHistory";
import { useViewerGenerationLimit } from "../../hooks/useViewerGenerationLimit";
import { getChatHistory, deleteChat, type Message as ApiMessage } from "../../utils/api";
import { logger } from "../../lib/logger";

function useAutoResizeTextarea({
    value,
    minHeight = 60,
    maxHeight = 200,
}: {
    value: string;
    minHeight?: number;
    maxHeight?: number;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback((reset = false) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = 'auto';
                textarea.style.height = `${minHeight}px`;
                textarea.style.overflowY = 'hidden';
                return;
        }

        // Сначала сбрасываем высоту для правильного расчета scrollHeight
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        
        // Если контент превышает maxHeight, фиксируем на maxHeight и включаем скролл
        if (scrollHeight > maxHeight) {
            textarea.style.height = `${maxHeight}px`;
            textarea.style.overflowY = 'auto';
        } else {
            const newHeight = Math.max(scrollHeight, minHeight);
            textarea.style.height = `${newHeight}px`;
            textarea.style.overflowY = 'hidden';
        }
    }, [minHeight, maxHeight]);

    useEffect(() => {
        if (!value || value.trim() === '') {
            // Если значение пустое, сбрасываем высоту
            adjustHeight(true);
        } else {
            adjustHeight();
        }
    }, [value, adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    prefix: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface AnimatedAIChatProps {
    onTypingChange?: (isTyping: boolean) => void;
    isListening?: boolean;
    onListeningChange?: (isListening: boolean) => void;
    isRecognizing?: boolean;
    onRecognizingChange?: (isRecognizing: boolean) => void;
    chatId?: string | null;
    onMessageSave?: (message: string, role: 'user' | 'assistant', messageId?: string) => Promise<void>;
    onChatIdChange?: (chatId: string | null) => void;
    quickCommands?: { label: string; prompt: string; icon: string }[];
}

export function AnimatedAIChat({ 
    onTypingChange, 
    isListening: externalIsListening, 
    onListeningChange, 
    isRecognizing: externalIsRecognizing, 
    onRecognizingChange,
    chatId,
    onMessageSave,
    onChatIdChange,
    quickCommands = []
}: AnimatedAIChatProps) {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const [mousePosition] = useState({ x: 0, y: 0 });
    const [attachments, setAttachments] = useState<string[]>([]);
    const [selectedCommands, setSelectedCommands] = useState<string[]>([]);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showChatHistory, setShowChatHistory] = useState(false);
    const [activeSuggestion] = useState(0);
    const currentChatIdRef = useRef<string | null>(null);
    
    // Лимит генераций для viewer
    const { canGenerate, incrementGeneration, isViewer } = useViewerGenerationLimit();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ value });

    // Закрытие палитры команд при клике вне её области
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            
            // Не закрываем, если клик по кнопке команды
            if (target.closest('[data-command-button]')) {
                return;
            }
            
            // Не закрываем, если клик внутри палитры
            if (
                commandPaletteRef.current &&
                commandPaletteRef.current.contains(target)
            ) {
                return;
            }
            
            // Закрываем палитру
            if (showCommandPalette) {
                setShowCommandPalette(false);
            }
        };

        // Используем setTimeout, чтобы onClick кнопки успел сработать первым
        const timeoutId = setTimeout(() => {
            if (showCommandPalette) {
                document.addEventListener('click', handleClickOutside, true);
            }
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [showCommandPalette]);

    // Загрузка истории чата при изменении chatId
    useEffect(() => {
        const loadChatHistory = async () => {
            // Инициализация чата
            if (!chatId) {
                // Если chatId не передан, мы не загружаем историю, а ждем первого сообщения
                logger.log('[AnimatedAIChat] No chatId provided, waiting for first message');
                setMessages([]);
                return;
            }

            // Если chatId изменился, сбрасываем состояние
            if (chatId !== currentChatIdRef.current) {
                logger.log('[AnimatedAIChat] ChatId changed:', { from: currentChatIdRef.current, to: chatId });
                setMessages([]);
                currentChatIdRef.current = chatId;
            }

            try {
                logger.log('[AnimatedAIChat] Loading history for chat:', chatId);
                const response = await getChatHistory(chatId);
                
                if (response.success && response.data && response.data.length > 0) {
                    // Преобразуем историю в формат сообщений
                    const formattedMessages: Message[] = response.data.map((msg: ApiMessage) => ({
                        id: msg.id || '',
                        text: msg.content,
                        isUser: msg.role === 'user',
                        timestamp: msg.created_at ? new Date(msg.created_at) : new Date()
                    }));
                    
                    setMessages(formattedMessages);
                    logger.log('[AnimatedAIChat] History loaded:', formattedMessages.length, 'messages');
                } else {
                    setMessages([]);
                    logger.log('[AnimatedAIChat] History is empty or failed to load');
                }
            } catch (error) {
                logger.error('[AnimatedAIChat] Failed to load history:', error);
                toast.error('Не удалось загрузить историю чата');
            }
        };

        loadChatHistory();
    }, [chatId]); // Убрали messages из dependencies чтобы избежать бесконечного цикла


    const isListening = externalIsListening ?? false;
    const isRecognizing = externalIsRecognizing ?? false;

    // Map quickCommands to CommandSuggestion format
    const commandSuggestions: CommandSuggestion[] = quickCommands.length > 0 
        ? quickCommands.map(cmd => ({
            prefix: cmd.prompt, // Use prompt as prefix/value
            label: cmd.label,
            icon: <MessageSquare className="w-4 h-4" />, // Default icon for now, can be mapped if needed
            description: cmd.prompt
        }))
        : [
            { 
                prefix: "/resume",
                label: "Создать резюме",
                icon: <FileText className="w-4 h-4" />, 
                description: "Помощь в создании профессионального резюме"
            },
            { 
                prefix: "/kpi",
                label: "Анализ KPI",
                icon: <BarChart3 className="w-4 h-4" />, 
                description: "Анализ ключевых показателей эффективности"
            },
            { 
                prefix: "/sales",
                label: "Скрипты продаж",
                icon: <MessageSquare className="w-4 h-4" />, 
                description: "Оптимизация скриптов для продаж"
            },
            { 
                prefix: "/quality",
                label: "Контроль качества",
                icon: <CheckCircle className="w-4 h-4" />, 
                description: "Управление качеством процессов"
            }
        ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape") {
                setShowCommandPalette(false);
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const sendToAI = async (message: string): Promise<string> => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('привет') || lowerMessage.includes('hello')) {
                return 'Привет! Я ваш AI-помощник Lumon. Чем могу помочь?';
            } else if (lowerMessage.includes('резюме') || lowerMessage.includes('resume')) {
                return 'Я помогу составить профессиональное резюме. Расскажите о вашем опыте работы и навыках.';
            } else if (lowerMessage.includes('kpi') || lowerMessage.includes('анализ')) {
                return 'Для анализа KPI мне нужны данные о ваших показателях. Какие метрики вы хотите проанализировать?';
            } else if (lowerMessage.includes('продаж') || lowerMessage.includes('скрипт')) {
                return 'Я помогу оптимизировать ваши скрипты продаж. Поделитесь текущими скриптами для анализа.';
            } else if (lowerMessage.includes('качество') || lowerMessage.includes('контроль')) {
                return 'Для контроля качества процессов нужны детали о ваших текущих процедурах. Что именно хотите улучшить?';
            } else {
                return `Я получил ваше сообщение: "${message}". Как AI-помощник Lumon, я готов помочь с бизнес-задачами. Уточните, пожалуйста, что именно вас интересует?`;
            }
        } catch (error) {
            logger.error('Ошибка при обращении к AI:', error);
            return 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.';
        }
    };

    const handleSendMessage = async () => {
        if (isListening || isRecognizing) {
            return;
        }
        
        if (!value.trim()) {
            return;
        }
        
        if (value.trim()) {
            try {
                // Проверяем лимит генераций для viewer
                if (isViewer && !canGenerate) {
                    const limitMessage: Message = {
                        id: Date.now().toString(),
                        text: `❌ Вы достигли дневного лимита генераций (3 в сутки). Лимит обновится завтра. Для снятия ограничений подключите компанию.`,
                        isUser: false,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, limitMessage]);
                    setValue("");
                    setTimeout(() => {
                        adjustHeight(true);
                    }, 0);
                    return;
                }

                const userMessage: Message = {
                    id: Date.now().toString(),
                    text: value,
                    isUser: true,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, userMessage]);
                setValue("");
                setIsTyping(true);
                onTypingChange?.(true);
                
                // Сбрасываем высоту textarea
                setTimeout(() => {
                    adjustHeight(true);
                }, 0);

                // Сохраняем сообщение пользователя
                if (onMessageSave && chatId) {
                    try {
                        await onMessageSave(userMessage.text, 'user', userMessage.id);
                    } catch (error) {
                        logger.error('[AnimatedAIChat] Failed to save user message:', error);
                    }
                }

                // Отправляем запрос к AI
                // TODO: Реализовать реальный запрос к AI через API
                // Пока используем заглушку sendToAI
                const responseText = await sendToAI(userMessage.text);
                
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: responseText,
                    isUser: false,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);

                // Сохраняем ответ AI
                if (onMessageSave && chatId) {
                    try {
                        await onMessageSave(aiMessage.text, 'assistant', aiMessage.id);
                    } catch (error) {
                        logger.error('[AnimatedAIChat] Failed to save AI message:', error);
                    }
                }

                // Увеличиваем счетчик генераций
                incrementGeneration();

            } catch (error) {
                logger.error('Ошибка при получении ответа от AI:', error);
                toast.error('Произошла ошибка при общении с AI');
            } finally {
                setIsTyping(false);
                onTypingChange?.(false);
            }
        }
    };

    interface SpeechRecognitionEvent {
        results: {
            [index: number]: {
                [index: number]: {
                    transcript: string;
                };
            };
        };
    }

    interface SpeechRecognitionErrorEvent {
        error: string;
    }

    interface SpeechRecognitionInstance {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        start(): void;
        stop(): void;
        abort(): void;
        onstart: ((ev: Event) => unknown) | null;
        onresult: ((ev: SpeechRecognitionEvent) => unknown) | null;
        onerror: ((ev: SpeechRecognitionErrorEvent) => unknown) | null;
        onend: ((ev: Event) => unknown) | null;
    }

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        SpeechRecognition: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        webkitSpeechRecognition: any;
    }

    const handleVoiceInput = () => {
        // Блокируем взаимодействие во время распознавания
        if (isRecognizing) {
            return;
        }

        // Проверяем поддержку Web Speech API
        const SpeechRecognitionConstructor = (window as unknown as Window).SpeechRecognition || (window as unknown as Window).webkitSpeechRecognition;

        if (!SpeechRecognitionConstructor) {
            toast.error('Ваш браузер не поддерживает распознавание речи. Попробуйте использовать Chrome или Edge.');
            return;
        }

        if (isListening) {
            // Останавливаем распознавание только если мы еще слушаем (не распознаем)
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            
            if (onListeningChange) {
                onListeningChange(false);
            }
        } else {
            // Запускаем распознавание
            const recognition = new SpeechRecognitionConstructor() as SpeechRecognitionInstance;
            recognition.lang = 'ru-RU';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                if (onListeningChange) {
                    onListeningChange(true);
                }
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                
                if (onRecognizingChange) {
                    onRecognizingChange(true);
                }
                
                // Добавляем распознанный текст в поле ввода
                setValue(prev => prev ? `${prev} ${transcript}` : transcript);
                
                setTimeout(() => {
                    if (onRecognizingChange) {
                        onRecognizingChange(false);
                    }
                }, 500);
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                logger.error('Speech recognition error:', event.error);
                
                if (onListeningChange) {
                    onListeningChange(false);
                }
                
                if (event.error === 'not-allowed') {
                    toast.error('Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера.');
                } else if (event.error === 'no-speech') {
                    toast.warning('Речь не распознана. Попробуйте еще раз.');
                }
            };

            recognition.onend = () => {
                if (onListeningChange) {
                    onListeningChange(false);
                }
                recognitionRef.current = null;
            };

            recognitionRef.current = recognition;
            
            try {
                recognition.start();
            } catch (error) {
                logger.error('Failed to start recognition:', error);
                if (onListeningChange) {
                    onListeningChange(false);
                }
            }
        }
    };

    const handleAttachFile = () => {
        if (isListening || isRecognizing) {
            return;
        }
        
        // Открываем диалог выбора файлов
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            
            // Добавляем выбранные файлы в attachments
            const fileNames = selectedFiles.map(file => file.name);
            setAttachments(prev => [...prev, ...fileNames]);
            
            // Очищаем input для возможности повторного выбора тех же файлов
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        if (isListening || isRecognizing || selectedCommands.length > 0) {
            return;
        }
        
        const selectedCommand = commandSuggestions[index];
        addSelectedCommand(selectedCommand.prefix);
        setShowCommandPalette(false);
    };

    const addSelectedCommand = (command: string) => {
        if (!selectedCommands.includes(command)) {
            setSelectedCommands(prev => [...prev, command]);
        }
    };

    const removeSelectedCommand = (command: string) => {
        setSelectedCommands(prev => prev.filter(cmd => cmd !== command));
    };

    const handleSelectChat = async (chatId: string) => {
        console.log('Выбран чат:', chatId);
        setShowChatHistory(false);
        
        // Загружаем реальную историю выбранного чата
        try {
            const response = await getChatHistory(chatId);
            if (response.success && response.data) {
                // Преобразуем формат сообщений из API в формат компонента
                const formattedMessages = response.data.map((msg: ApiMessage) => ({
                    id: msg.id || '',
                    text: msg.content,
                    isUser: msg.role === 'user',
                    timestamp: msg.created_at ? new Date(msg.created_at) : new Date()
                }));
                setMessages(formattedMessages);
                // Обновляем chatId через callback
                if (onChatIdChange) {
                    onChatIdChange(chatId);
                }
            } else {
                console.error('Failed to load chat history:', response.error);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            setMessages([]);
        }
    };

    const handleDeleteChat = async (deletedChatId: string) => {
        console.log('[AnimatedAIChat] Deleting chat:', deletedChatId);

        try {
            const result = await deleteChat(deletedChatId);

            if (result.success) {
                console.log('[AnimatedAIChat] Chat deleted successfully:', deletedChatId);

                // Если удалили текущий открытый чат - очищаем UI
                if (deletedChatId === chatId) {
                    handleCreateNewChat();
                }
            } else {
                console.error('[AnimatedAIChat] Failed to delete chat:', result.error);
                toast.error(`Ошибка удаления чата: ${result.error}`);
            }
        } catch (error) {
            console.error('[AnimatedAIChat] Error deleting chat:', error);
            toast.error(`Ошибка удаления чата: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleCreateNewChat = () => {
        console.log('[AnimatedAIChat] handleCreateNewChat called', { currentChatId: chatId, hasOnChatIdChange: !!onChatIdChange });
        // Очищаем текущие сообщения
        setMessages([]);
        // Очищаем выбранные команды
        setSelectedCommands([]);
        // Очищаем вложения
        setAttachments([]);
        // Очищаем поле ввода
        setValue("");
        // Сбрасываем высоту textarea
        adjustHeight(true);
        // Очищаем chatId через callback
        if (onChatIdChange) {
            console.log('[AnimatedAIChat] Clearing chatId via onChatIdChange(null)');
            onChatIdChange(null);
        } else {
            console.warn('[AnimatedAIChat] onChatIdChange is not provided!');
        }
    };

    return (
        <div className="h-full flex flex-col w-full bg-transparent text-gray-900 dark:text-white relative overflow-hidden">
            {/* Фоновые эффекты */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>
            
            {/* Скроллируемый контент чата */}
            <div className="flex-1 overflow-y-auto p-1 pb-32 relative z-0">
                <div className={`w-full max-w-md mx-auto relative ${messages.length === 0 ? 'min-h-[calc(100vh-200px)] flex items-center py-8' : ''}`}>
                <motion.div 
                    className={`relative z-0 ${messages.length > 0 ? 'space-y-6' : 'space-y-12 w-full'}`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                        {/* Приветственное сообщение */}
                        {messages.length === 0 && <WelcomeMessage />}

                    {/* История чата */}
                    {messages.length > 0 && (
                            <MessageList
                                messages={messages}
                                isTyping={isTyping}
                            />
                        )}

                        {/* Быстрые команды */}
                    {messages.length === 0 && selectedCommands.length === 0 && (
                            <QuickCommands
                                suggestions={commandSuggestions}
                                onSelect={selectCommandSuggestion}
                                isListening={isListening}
                                selectedCommands={selectedCommands}
                            />
                    )}
                </motion.div>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Поле ввода и кнопка истории */}
            <div className="flex-shrink-0 relative z-10 w-full overflow-visible">
                <div className="w-full max-w-md mx-auto px-1 overflow-visible">
                    <InputArea
                        value={value}
                        onChange={setValue}
                        onSend={handleSendMessage}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        onVoiceInput={handleVoiceInput}
                        onAttachFile={handleAttachFile}
                        onToggleCommandPalette={() => setShowCommandPalette(prev => !prev)}
                        isListening={isListening}
                        isRecognizing={isRecognizing}
                        isTyping={isTyping}
                        attachments={attachments}
                        onRemoveAttachment={removeAttachment}
                        selectedCommands={selectedCommands}
                        onRemoveSelectedCommand={removeSelectedCommand}
                        commandSuggestions={commandSuggestions.map(s => ({
                            icon: s.icon,
                            label: s.label,
                            prefix: s.prefix
                        }))}
                        showCommandPalette={showCommandPalette}
                        commandPaletteRef={commandPaletteRef}
                        activeSuggestion={activeSuggestion}
                        onSelectCommand={selectCommandSuggestion}
                        onToggleHistory={() => setShowChatHistory(prev => !prev)}
                        textareaRef={textareaRef}
                        adjustHeight={adjustHeight}
                    />
                </div>
            </div>

            {/* Эффект фокуса */}
            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}

            {/* Chat History Modal */}
            <ChatHistory
                isOpen={showChatHistory}
                onClose={() => setShowChatHistory(false)}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                onCreateNewChat={handleCreateNewChat}
            />

            {/* Скрытый input для выбора файлов */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt,.jpg,.jpeg,.png"
            />
        </div>
    );
}

