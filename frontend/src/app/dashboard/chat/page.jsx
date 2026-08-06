"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../../utils/api';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize a chat session
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await api.post('/chat/sessions', { title: "New Conversation" });
        setSessionId(res.data.id);
      } catch (e) {
        console.error("Failed to start session", e);
      }
    };
    initSession();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/chat/sessions/${sessionId}/messages`, {
        content: userMsg.content,
        department_id: null
      });
      
      let parsedCitations = [];
      try {
        if (res.data.citations) {
          parsedCitations = JSON.parse(res.data.citations);
        }
      } catch (e) {}

      const aiMsg = {
        id: res.data.id.toString(),
        role: 'ai',
        content: res.data.content,
        citations: parsedCitations
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = {
        id: Date.now().toString(),
        role: 'ai',
        content: 'Error: Could not reach the AI service. Please check if Ollama is running locally.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
      <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center bg-white dark:bg-slate-900 z-10 transition-colors">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            MAIKMS Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Multilingual Knowledge Retrieval (English & Marathi)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">How can I help you today?</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Ask a question in English or Marathi about municipal rules, acts, or GRs.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'ai' ? 'dark:prose-invert prose-slate' : 'text-white'}`}>
                  {msg.role === 'ai' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</div>
                  )}
                </div>
                
                {msg.role === 'ai' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cit, idx) => (
                        <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm hover:shadow hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer">
                          <span className="font-semibold text-blue-700 dark:text-blue-400 truncate max-w-[200px]">{cit.document_name}</span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="font-medium">Sec: {cit.section}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Searching documents...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question in Marathi or English..."
            className="w-full pl-4 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={loading || !sessionId}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !sessionId}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
