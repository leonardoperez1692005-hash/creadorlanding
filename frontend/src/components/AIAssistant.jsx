import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { api } from '../lib/api';

export default function AIAssistant({ context }) { // context could be current step or section data
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: '¡Hola! Soy tu asistente creativo. ¿Necesitas ayuda con los textos de tu landing?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.askAI({ prompt: input, context });
            const aiMsg = { role: 'ai', text: res.suggestion || 'Lo siento, no pude generar una sugerencia.' };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Error al conectar con la IA.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 bg-sl-magenta rounded-full shadow-neon-magenta hover:scale-110 transition-transform text-white group"
                >
                    <Sparkles className="w-6 h-6 animate-pulse group-hover:animate-none" />
                </button>
            )}

            {/* Chat Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-sl-bg border-l border-sl-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="p-4 border-b border-sl-border flex items-center justify-between bg-sl-bg-alt">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sl-magenta" />
                        <h3 className="font-heading font-bold text-lg text-white">AI Assistant</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-sl-magenta/20' : 'bg-sl-cyan/20'}`}>
                                {msg.role === 'ai' ? <Bot size={16} className="text-sl-magenta" /> : <User size={16} className="text-sl-cyan" />}
                            </div>
                            <div className={`rounded-lg p-3 text-sm max-w-[80%] ${msg.role === 'ai' ? 'bg-sl-bg-alt text-gray-200' : 'bg-sl-cyan/10 text-sl-cyan border border-sl-cyan/30'}`}>
                                {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-sl-magenta/20 flex items-center justify-center animate-pulse">
                                <Bot size={16} className="text-sl-magenta" />
                            </div>
                            <div className="bg-sl-bg-alt rounded-lg p-3 text-sm text-gray-400">
                                Pensando...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-sl-border bg-sl-bg-alt">
                    <div className="flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Pide una sugerencia..."
                            className="flex-1 bg-sl-bg border border-sl-border rounded-lg px-3 py-2 text-sm text-white focus:border-sl-magenta focus:outline-none resize-none h-12"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-sl-magenta text-white p-3 rounded-lg hover:bg-sl-magenta/80 disabled:opacity-50 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
