import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Paperclip, SendIcon, XIcon, Command, Mic, MicOff, History } from 'lucide-react';
import Textarea from './Textarea.tsx';

interface InputAreaProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
    onVoiceInput: () => void;
    onAttachFile: () => void;
    onToggleCommandPalette: () => void;
    isListening: boolean;
    isRecognizing: boolean;
    isTyping: boolean;
    attachments: string[];
    onRemoveAttachment: (index: number) => void;
    selectedCommands: string[];
    onRemoveSelectedCommand: (command: string) => void;
    commandSuggestions: Array<{
        icon: React.ReactNode;
        label: string;
        prefix: string;
    }>;
    showCommandPalette: boolean;
    commandPaletteRef: React.RefObject<HTMLDivElement>;
    activeSuggestion: number;
    onSelectCommand: (index: number) => void;
    onToggleHistory?: () => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    adjustHeight: (reset?: boolean) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
    value,
    onChange,
    onSend,
    onKeyDown,
    onFocus,
    onBlur,
    onVoiceInput,
    onAttachFile,
    onToggleCommandPalette,
    isListening,
    isRecognizing,
    isTyping,
    attachments,
    onRemoveAttachment,
    selectedCommands,
    onRemoveSelectedCommand,
    commandSuggestions,
    showCommandPalette,
    commandPaletteRef,
    activeSuggestion,
    onSelectCommand,
    onToggleHistory,
    textareaRef,
    adjustHeight
}) => {
    return (
        <div className="flex-shrink-0 w-full overflow-hidden">
            <div className="w-full max-w-md mx-auto px-1 overflow-hidden">
                <motion.div 
                    className={cn(
                        "relative backdrop-blur-xl bg-white/60 dark:bg-white/[0.03] rounded-2xl shadow-2xl z-20 w-full overflow-hidden",
                        isRecognizing
                            ? "border-2 border-orange-500 dark:border-orange-400"
                            : isListening
                            ? "border-2 border-red-500 dark:border-red-400"
                            : "border border-gray-200/50 dark:border-white/[0.05]"
                    )}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Command Palette */}
                    <AnimatePresence>
                        {showCommandPalette && selectedCommands.length === 0 && (
                            <motion.div 
                                ref={commandPaletteRef}
                                className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-white/95 dark:bg-black/90 rounded-lg z-50 shadow-lg border border-gray-200/50 dark:border-white/10 overflow-hidden"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="py-1 bg-white/90 dark:bg-black/95">
                                    {commandSuggestions.map((suggestion, index) => (
                                        <motion.div
                                            key={suggestion.prefix}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-xs transition-colors",
                                                isListening || selectedCommands.length > 0
                                                    ? "cursor-not-allowed text-gray-400 dark:text-white/30"
                                                    : activeSuggestion === index 
                                                    ? "bg-blue-100 dark:bg-white/10 text-blue-900 dark:text-white cursor-pointer" 
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                                            )}
                                            onClick={() => onSelectCommand(index)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center text-gray-500 dark:text-white/60">
                                                {suggestion.icon}
                                            </div>
                                            <div className="font-medium">{suggestion.label}</div>
                                            <div className="text-gray-400 dark:text-white/40 text-xs ml-1">
                                                {suggestion.prefix}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4">
                        {/* Выбранные команды */}
                        {selectedCommands.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedCommands.map((command) => {
                                    const suggestion = commandSuggestions.find(cmd => cmd.prefix === command);
                                    return (
                                        <motion.div
                                            key={command}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs"
                                        >
                                            <div className="w-3 h-3 flex items-center justify-center">
                                                {suggestion?.icon}
                                            </div>
                                            <span className="font-medium">{suggestion?.label}</span>
                                            <button
                                                onClick={() => onRemoveSelectedCommand(command)}
                                                className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                        
                        
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                onChange(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={onKeyDown}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            placeholder={isListening ? "Идет запись голосового сообщения..." : isRecognizing ? "Распознаю голосовое сообщение..." : "Задайте вопрос..."}
                            containerClassName="w-full"
                            disabled={isListening || isRecognizing}
                            readOnly={isListening || isRecognizing}
                            className={cn(
                                "w-full px-0 py-0",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-gray-900 dark:text-white/90 text-sm",
                                "focus:outline-none",
                                "placeholder:text-gray-500 dark:placeholder:text-white/20",
                                "min-h-[60px]",
                                "break-words"
                            )}
                        style={{
                            overflowX: "hidden",
                            wordWrap: "break-word",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                            minWidth: 0,
                            width: "100%",
                        }}
                            showRing={false}
                        />
                    </div>

                    <AnimatePresence>
                        {attachments.length > 0 && (
                            <motion.div 
                                className="px-4 pb-3 flex gap-2 flex-wrap"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {attachments.map((file, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center gap-2 text-xs bg-gray-100/80 dark:bg-white/[0.03] py-1.5 px-3 rounded-lg text-gray-700 dark:text-white/70"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <span>{file}</span>
                                        <button 
                                            onClick={() => onRemoveAttachment(index)}
                                            className="text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4 border-t border-gray-200/50 dark:border-white/[0.05] flex items-center gap-2">
                        <motion.button
                            type="button"
                            onClick={onAttachFile}
                            whileTap={!isListening && !isRecognizing ? { scale: 0.94 } : {}}
                            disabled={isListening || isRecognizing}
                            className={cn(
                                "p-2 rounded-lg transition-colors relative group",
                                isListening || isRecognizing
                                    ? "text-gray-400 dark:text-white/20 cursor-not-allowed opacity-50"
                                    : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/90 cursor-pointer"
                            )}
                        >
                            <Paperclip className="w-4 h-4" />
                            <motion.span
                                className="absolute inset-0 bg-gray-200/50 dark:bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                layoutId="button-highlight"
                            />
                        </motion.button>
                        
                        <motion.button
                            type="button"
                            data-command-button
                            onClick={(e) => {
                                e.stopPropagation();
                                
                                // Блокируем если идет распознавание или прослушивание
                                if (isListening || isRecognizing || selectedCommands.length > 0) {
                                    e.preventDefault();
                                    return;
                                }
                                
                                // Вызываем переключение палитры команд
                                onToggleCommandPalette();
                            }}
                            whileTap={!isListening && !isRecognizing && selectedCommands.length === 0 ? { scale: 0.94 } : {}}
                            className={cn(
                                "p-2 rounded-lg transition-colors relative group",
                                selectedCommands.length > 0 || isListening || isRecognizing
                                    ? "text-gray-400 dark:text-white/20 cursor-not-allowed opacity-50"
                                    : showCommandPalette 
                                    ? "bg-gray-200/50 dark:bg-white/10 text-gray-700 dark:text-white/90 cursor-pointer"
                                    : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/90 cursor-pointer"
                            )}
                            tabIndex={(isListening || isRecognizing || selectedCommands.length > 0) ? -1 : 0}
                        >
                            <Command className="w-4 h-4" />
                            <motion.span
                                className="absolute inset-0 bg-gray-200/50 dark:bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                layoutId="button-highlight"
                            />
                        </motion.button>
                        
                        <motion.button
                            type="button"
                            onClick={onToggleHistory}
                            whileTap={{ scale: 0.94 }}
                            className="p-2 rounded-lg transition-colors relative group text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/90"
                        >
                            <History className="w-4 h-4" />
                            <motion.span
                                className="absolute inset-0 bg-gray-200/50 dark:bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                layoutId="button-highlight"
                            />
                        </motion.button>
                        
                        <div className="flex-1 flex justify-center mr-4">
                            <motion.button
                                type="button"
                                onClick={onVoiceInput}
                                whileTap={{ scale: 0.94 }}
                                className={cn(
                                    "p-2 rounded-lg transition-colors relative group w-full max-w-none flex items-center justify-center",
                                    isListening 
                                        ? "text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/20" 
                                        : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/90"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {isListening ? (
                                        <motion.div
                                            key="listening"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <MicOff className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="mic"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Mic className="w-4 h-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {isListening && (
                                    <motion.div
                                        className="absolute inset-0 bg-red-200/50 dark:bg-red-900/20 rounded-lg"
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            opacity: [0.5, 0.8, 0.5]
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                )}
                                
                                <motion.span
                                    className={cn(
                                        "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
                                        isListening 
                                            ? "bg-red-200/50 dark:bg-red-900/20" 
                                            : "bg-gray-200/50 dark:bg-white/[0.05]"
                                    )}
                                    layoutId="voice-button-highlight"
                                />
                            </motion.button>
                        </div>
                        
                        <motion.button
                            type="button"
                            onClick={onSend}
                            whileHover={!isListening && !isRecognizing ? { scale: 1.01 } : {}}
                            whileTap={!isListening && !isRecognizing ? { scale: 0.98 } : {}}
                            disabled={isTyping || !value.trim() || isListening || isRecognizing}
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                "flex items-center justify-center",
                                isListening || isRecognizing
                                    ? "bg-gray-200/50 dark:bg-white/[0.05] text-gray-500 dark:text-white/40 cursor-not-allowed"
                                    : value.trim()
                                    ? "bg-blue-600 dark:bg-white text-white dark:text-[#0A0A0B] shadow-lg shadow-blue-500/20 dark:shadow-white/10"
                                    : "bg-gray-200/50 dark:bg-white/[0.05] text-gray-500 dark:text-white/40"
                            )}
                        >
                            <SendIcon className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
