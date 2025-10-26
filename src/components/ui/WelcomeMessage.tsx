import React from 'react';
import { motion } from 'framer-motion';

export const WelcomeMessage: React.FC = () => {
    return (
        <div className="text-center space-y-3">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
            >
                <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900/90 to-gray-600/40 dark:from-white/90 dark:to-white/40 pb-1">
                    Добро пожаловать в Lumon
                </h1>
                <motion.div 
                    className="h-px bg-gradient-to-r from-transparent via-gray-400/20 dark:via-white/20 to-transparent"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                />
            </motion.div>
            <motion.p 
                className="text-sm text-gray-600/60 dark:text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                Ваш AI-помощник для бизнес-задач
            </motion.p>
        </div>
    );
};
