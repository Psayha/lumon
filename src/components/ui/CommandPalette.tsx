import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface CommandPaletteProps {
    show: boolean;
    suggestions: CommandSuggestion[];
    activeSuggestion: number;
    onSelect: (index: number) => void;
    isListening: boolean;
    selectedCommands: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    show,
    suggestions,
    activeSuggestion,
    onSelect,
    isListening,
    selectedCommands
}) => {
    return (
        <AnimatePresence>
            {show && selectedCommands.length === 0 && (
                <motion.div 
                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-white/95 dark:bg-black/90 rounded-lg z-50 shadow-lg border border-gray-200/50 dark:border-white/10 overflow-hidden"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                >
                    <div className="py-1 bg-white/90 dark:bg-black/95">
                        {suggestions.map((suggestion, index) => (
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
                                onClick={() => onSelect(index)}
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
    );
};
