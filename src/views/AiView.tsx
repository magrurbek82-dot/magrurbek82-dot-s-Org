/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMagaStore } from '../store';
import { Send, Sparkles, RefreshCw, Bot, User, ArrowRight } from 'lucide-react';

export default function AiView() {
  const aiChatHistory = useMagaStore(state => state.aiChatHistory);
  const isAiTyping = useMagaStore(state => state.isAiTyping);
  const sendAiMessage = useMagaStore(state => state.sendAiMessage);
  const clearAiChat = useMagaStore(state => state.clearAiChat);

  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, isAiTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    sendAiMessage(text);
    setInputMessage('');
  };

  const quickPrompts = [
    "Xarajatlarimni qanday kamaytiray?",
    "Limitimni tahlil qil",
    "Tejamkorlik maslahati bering"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pt-2 pb-28 relative z-10">
      
      {/* Sleek Chat Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1">
              Maga AI Assistant
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
            </h2>
            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest block">
              ● Faol Tahlilchi
            </span>
          </div>
        </div>

        <button
          onClick={clearAiChat}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
          title="Tozalash"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tozalash
        </button>
      </div>

      {/* Message scroll area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-none pb-4">
        <AnimatePresence initial={false}>
          {aiChatHistory.map((msg) => {
            const isAi = msg.role === 'assistant';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border text-xs select-none ${
                  isAi 
                    ? 'bg-blue-50 border-blue-100 text-blue-600' 
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-[20px] text-xs leading-relaxed shadow-[0_4px_15px_rgba(0,0,0,0.01)] ${
                    isAi 
                      ? 'bg-white text-slate-900 border border-slate-100 rounded-tl-sm' 
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`text-[9px] font-mono text-slate-400 block ${isAi ? 'text-left pl-1' : 'text-right pr-1'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isAiTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[85%] self-start mr-auto"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3.5 bg-white border border-slate-100 rounded-[20px] rounded-tl-sm flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Action prompts */}
      <div className="mb-3 space-y-1.5">
        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Tezkor so'rovlar</span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {quickPrompts.map((prompt, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSendMessage(prompt)}
              className="flex-shrink-0 snap-center px-3.5 py-2 rounded-xl bg-white border border-slate-100 text-slate-700 font-sans text-xs flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-blue-200 cursor-pointer"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Message input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }}
        className="flex gap-2 bg-white p-2 border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Maga AI-dan so'rang... (masalan, limit tahlili)"
          className="flex-1 bg-transparent px-3 py-2 text-xs font-sans text-slate-900 outline-none placeholder-slate-400"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!inputMessage.trim()}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            inputMessage.trim() 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-slate-50 text-slate-300 border border-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>

    </div>
  );
}
