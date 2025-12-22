import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Expense, ExpenseSummary } from '../../types';
import { chatWithGemini, generateInsights } from '../../services/geminiService';

interface AIChatProps {
  expenses: Expense[];
  summary: ExpenseSummary;
  initialInsight?: string;
  onRefreshInsight: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChat: React.FC<AIChatProps> = ({ expenses, summary, initialInsight, onRefreshInsight }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with the daily insight if available
  useEffect(() => {
    if (initialInsight && messages.length === 0) {
      setMessages([{ role: 'assistant', content: initialInsight }]);
    }
  }, [initialInsight]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithGemini(userMsg, expenses, summary);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error analyzing your data." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex-1 flex flex-col h-full bg-gradient-to-br from-indigo-900/20 via-slate-900/40 to-slate-900/40 border-indigo-500/20 shadow-xl shadow-indigo-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-indigo-500/10">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <CardTitle className="text-indigo-100">AI Financial Assistant</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshInsight}
          className="text-xs text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20"
        >
          Regenerate Daily Insight
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-[450px]">
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[450px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-70">
              <div className="p-4 bg-slate-900 rounded-full ring-1 ring-slate-800">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
              </div>
              <p>Ask me anything about your expenses!</p>
              <div className="flex flex-wrap justify-center gap-2">
                 <button onClick={() => setInput("How much did I spend on Food last month?")} className="text-xs bg-slate-800 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 transition-colors">"Spend on Food?"</button>
                 <button onClick={() => setInput("Identify my highest spending category.")} className="text-xs bg-slate-800 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 transition-colors">"Highest category?"</button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700 shadow-md backdrop-blur-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                     <div className="prose prose-invert prose-indigo prose-sm max-w-none">
                       <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                     </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-slate-800/80 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700">
                 <div className="flex gap-1">
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-indigo-500/10 bg-slate-900/30">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your spending..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
