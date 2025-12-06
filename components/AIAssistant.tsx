import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { askDrugInfo, analyzeInventory } from '../services/geminiService';
import { Medicine } from '../types';

interface AIAssistantProps {
  inventory: Medicine[];
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ inventory }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'नमस्कार! म PharmaFlow सहायक हुँ। म औषधि जानकारी, अन्तरक्रिया जाँच, वा मौज्दात विश्लेषणमा मद्दत गर्न सक्छु।', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const responseText = await askDrugInfo(userMsg.text);
    
    const aiMsg: Message = { id: crypto.randomUUID(), role: 'ai', text: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleAnalyzeInventory = async () => {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: "Analyze my current inventory status.", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const responseText = await analyzeInventory(inventory);
    
    const aiMsg: Message = { id: crypto.randomUUID(), role: 'ai', text: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-teal-400 to-blue-500 p-2 rounded-lg text-white">
             <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">स्मार्ट सहायक (Smart Assistant)</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              Powered by Gemini 2.5 Flash <Sparkles className="w-3 h-3 text-amber-400" />
            </p>
          </div>
        </div>
        <button 
          onClick={handleAnalyzeInventory}
          disabled={isLoading}
          className="text-xs font-medium bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-600 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          मौज्दात अवस्था जाँच गर्नुहोस्
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}
            `}>
              {msg.role === 'ai' ? (
                <div className="prose prose-sm prose-teal max-w-none">
                  {/* Basic markdown rendering for lists and bold text */}
                  {msg.text.split('\n').map((line, i) => {
                     if (line.startsWith('* ')) return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>
                     if (line.startsWith('## ')) return <h4 key={i} className="font-bold text-lg mt-2 mb-1 text-slate-900">{line.substring(3)}</h4>
                     if (line.startsWith('**')) return <p key={i} className="font-bold">{line.replace(/\*\*/g, '')}</p>
                     return <p key={i} className="min-h-[1em]">{line}</p>
                  })}
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="औषधिको बारेमा सोध्नुहोस्..."
            className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none max-h-32 min-h-[50px]"
            rows={1}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> AI ले गल्ती गर्न सक्छ। महत्त्वपूर्ण जानकारी प्रमाणित गर्नुहोस्।
        </p>
      </div>
    </div>
  );
};