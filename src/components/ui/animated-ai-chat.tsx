import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
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
}

export function AnimatedAIChat({ 
    onTypingChange, 
    isListening: externalIsListening, 
    onListeningChange, 
    isRecognizing: externalIsRecognizing, 
    onRecognizingChange 
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
    const [, startTransition] = useTransition();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const commandPaletteRef = useRef<HTMLDivElement>(null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ value });

    const isListening = externalIsListening ?? false;
    const isRecognizing = externalIsRecognizing ?? false;

    const commandSuggestions: CommandSuggestion[] = [
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
            console.error('Ошибка при обращении к AI:', error);
            return 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.';
        }
    };

    const handleSendMessage = async () => {
        if (isListening || isRecognizing) {
            return;
        }
        
        if (value.trim()) {
            const userMessage: Message = {
                id: Date.now().toString(),
                text: value.trim(),
                isUser: true,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMessage]);
            setValue("");
            // Сбрасываем высоту после очистки значения
            setTimeout(() => {
                adjustHeight(true);
            }, 0);

            startTransition(() => {
                setIsTyping(true);
                onTypingChange?.(true);
            });

            try {
                const aiResponse = await sendToAI(userMessage.text);
                
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse,
                    isUser: false,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error('Ошибка при получении ответа от AI:', error);
            } finally {
                setIsTyping(false);
                onTypingChange?.(false);
            }
        }
    };

    const handleVoiceInput = () => {
        if (isListening) {
            if (onListeningChange) {
                onListeningChange(false);
            }
            
            if (onRecognizingChange) {
                onRecognizingChange(true);
            }
            
            setTimeout(() => {
                setValue(prev => prev + " Голосовое сообщение");
                
                if (onRecognizingChange) {
                    onRecognizingChange(false);
                }
            }, 3000);
        } else {
            if (onListeningChange) {
                onListeningChange(true);
            }
        }
    };

    const handleAttachFile = () => {
        if (isListening) {
            return;
        }
        
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        if (isListening || selectedCommands.length > 0) {
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

    const handleSelectChat = (chatId: string) => {
        console.log('Выбран чат:', chatId);
        setShowChatHistory(false);
        
        // Загружаем историю выбранного чата
        const mockChatHistory = {
            '1': [
                { id: '1', text: 'Помогите составить резюме для позиции менеджера по продажам', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 30) },
                { id: '2', text: 'Конечно! Давайте создадим профессиональное резюме. Расскажите о вашем опыте работы в продажах.', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 29) },
                { id: '3', text: 'У меня 3 года опыта в B2B продажах, работал с крупными клиентами', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 28) },
                { id: '4', text: 'Отлично! Какие достижения можете выделить? Например, увеличение продаж или работа с ключевыми клиентами?', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 27) }
            ],
            '2': [
                { id: '1', text: 'Какие KPI нужно отслеживать для отдела продаж?', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
                { id: '2', text: 'Для отдела продаж важно отслеживать: конверсию лидов, средний чек, время закрытия сделки, количество активных клиентов.', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5) }
            ],
            '3': [
                { id: '1', text: 'Как улучшить конверсию в воронке продаж?', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
                { id: '2', text: 'Для улучшения конверсии рекомендую: персонализировать подход, работать с возражениями, использовать социальные доказательства.', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 10) }
            ],
            '4': [
                { id: '1', text: 'Какие процедуры контроля качества нужно внедрить?', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
                { id: '2', text: 'Рекомендую внедрить: чек-листы для каждого этапа, регулярные аудиты, обратную связь от клиентов, метрики качества.', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 15) }
            ]
        };
        
        const selectedChatMessages = mockChatHistory[chatId as keyof typeof mockChatHistory] || [];
        setMessages(selectedChatMessages);
    };

    const handleDeleteChat = (chatId: string) => {
        console.log('Удален чат:', chatId);
        // В реальном приложении здесь будет API вызов для удаления чата
        // Пока просто показываем уведомление
        alert(`Чат "${chatId}" будет удален (в реальном приложении)`);
    };

    const handleCreateNewChat = () => {
        console.log('Создание нового чата');
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
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
            <div className="flex-shrink-0 relative z-10 w-full overflow-hidden">
                <div className="w-full max-w-md mx-auto px-1 overflow-hidden">
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
        </div>
    );
}

