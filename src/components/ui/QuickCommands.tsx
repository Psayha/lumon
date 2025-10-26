import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface QuickCommandsProps {
    suggestions: CommandSuggestion[];
    onSelect: (index: number) => void;
    isListening: boolean;
    selectedCommands: string[];
}

export const QuickCommands: React.FC<QuickCommandsProps> = ({
    suggestions,
    onSelect,
    isListening,
    selectedCommands
}) => {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-3">
                Выберите готовые команды для работы
            </h3>
            <div className="grid grid-cols-2 gap-1.5 max-w-md mx-auto">
                {suggestions.map((suggestion, index) => (
                    <motion.button
                        key={suggestion.prefix}
                        onClick={() => onSelect(index)}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all relative group min-w-0",
                            isListening || selectedCommands.length > 0
                                ? "bg-gray-100/50 dark:bg-white/[0.01] text-gray-400 dark:text-white/30 cursor-not-allowed"
                                : "bg-gray-100/80 dark:bg-white/[0.02] hover:bg-gray-200/80 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/90"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        disabled={isListening || selectedCommands.length > 0}
                    >
                        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                            {suggestion.icon}
                        </div>
                        <span className="text-xs font-medium truncate">{suggestion.label}</span>
                        <motion.div
                            className="absolute inset-0 border border-gray-300/20 dark:border-white/[0.05] rounded-md"
                            initial={false}
                            animate={{
                                opacity: [0, 1],
                                scale: [0.98, 1],
                            }}
                            transition={{
                                duration: 0.3,
                                ease: "easeOut",
                            }}
                        />
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
