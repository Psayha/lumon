import React from 'react';
import { motion } from 'framer-motion';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface MessageListProps {
    messages: Message[];
    isTyping: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
    return (
        <motion.div 
            className="w-full max-w-2xl mx-auto space-y-4 max-h-[60vh] overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {messages.map((message) => (
                <motion.div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            message.isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                    >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                            message.isUser 
                                ? 'text-blue-100' 
                                : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {message.timestamp.toLocaleTimeString()}
                        </p>
                    </div>
                </motion.div>
            ))}
            
            {/* Индикатор печати */}
            {isTyping && (
                <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                >
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
