"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, BookOpen, Building2, Zap, Mic, Volume2, Plus, MessageSquare, Trash2, Copy, Edit2, Check, X, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../../utils/api';

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Department state
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  
  // Edit State
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDepartments();
    loadSessions();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments/');
      setDepartments(res.data);
    } catch (e) {
      console.error("Failed to fetch departments");
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !sessionId) {
        loadChat(res.data[0].id);
      } else if (res.data.length === 0) {
        createNewChat();
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: "New Conversation" });
      setSessionId(res.data.id);
      setMessages([]);
      loadSessions();
    } catch (e) {
      console.error("Failed to create session", e);
    }
  };

  const loadChat = async (id) => {
    setSessionId(id);
    try {
      const res = await api.get(`/chat/sessions/${id}/messages`);
      const mappedMessages = res.data.map(msg => {
        let parsedCitations = [];
        try {
          if (msg.citations) parsedCitations = JSON.parse(msg.citations);
        } catch (e) {}
        return { ...msg, id: msg.id.toString(), citations: parsedCitations };
      });
      setMessages(mappedMessages);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/sessions/${id}`);
      if (sessionId === id) {
        setSessionId(null);
        setMessages([]);
        loadSessions(); // Will load top chat or create new
      } else {
        loadSessions();
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const renameChat = async (id, e) => {
    e.stopPropagation();
    if (!editSessionTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await api.put(`/chat/sessions/${id}`, { title: editSessionTitle });
      setEditingSessionId(null);
      loadSessions();
    } catch (err) {
      console.error("Failed to rename chat", err);
    }
  };

  // Speech Recognition setup
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onerror = (event) => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return alert("Text-to-speech is not supported.");
    window.speechSynthesis.cancel();
    let cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Auto-update title if it's the first message
    if (messages.length === 0) {
      api.put(`/chat/sessions/${sessionId}`, { title: input.substring(0, 30) + "..." })
        .then(() => loadSessions());
    }

    try {
      const payload = {
        content: userMsg.content,
        department_id: selectedDepartmentId ? parseInt(selectedDepartmentId) : null
      };
      const res = await api.post(`/chat/sessions/${sessionId}/messages`, payload);
      
      let parsedCitations = [];
      try {
        if (res.data.citations) parsedCitations = JSON.parse(res.data.citations);
      } catch (e) {}

      const aiMsg = {
        id: res.data.id.toString(),
        role: 'ai',
        content: res.data.content,
        citations: parsedCitations
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Error: Could not reach the AI service.' }]);
    } finally {
      setLoading(false);
    }
  };

  const submitEdit = async (msgId) => {
    if (!editContent.trim() || loading) return;
    setEditingMsgId(null);
    setLoading(true);
    try {
      // Optimistically update UI
      const msgIndex = messages.findIndex(m => m.id === msgId);
      const updatedMessages = messages.slice(0, msgIndex + 1);
      updatedMessages[msgIndex].content = editContent;
      setMessages(updatedMessages);

      const payload = {
        content: editContent,
        department_id: selectedDepartmentId ? parseInt(selectedDepartmentId) : null
      };
      const res = await api.put(`/chat/sessions/${sessionId}/messages/${msgId}`, payload);
      
      let parsedCitations = [];
      try { if (res.data.citations) parsedCitations = JSON.parse(res.data.citations); } catch (e) {}

      const aiMsg = {
        id: res.data.id.toString(),
        role: 'ai',
        content: res.data.content,
        citations: parsedCitations
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error("Failed to edit", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 relative overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 transition-all duration-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden`}>
        <div className="p-4">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 px-4 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => loadChat(session.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                sessionId === session.id 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden w-full mr-2">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                {editingSessionId === session.id ? (
                  <input
                    type="text"
                    value={editSessionTitle}
                    onChange={(e) => setEditSessionTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameChat(session.id, e);
                      if (e.key === 'Escape') setEditingSessionId(null);
                    }}
                    onBlur={(e) => renameChat(session.id, e)}
                    autoFocus
                    className="w-full bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                ) : (
                  <span className="truncate text-sm font-medium">{session.title}</span>
                )}
              </div>
              
              {editingSessionId !== session.id && (
                <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(session.id);
                      setEditSessionTitle(session.title);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => deleteChat(session.id, e)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center bg-white dark:bg-slate-900 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                ASK SMKC
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Multilingual Knowledge Retrieval</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <select 
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 max-w-[120px] sm:max-w-none"
            >
              <option value="">All Departments</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
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
                <p className="text-slate-500 dark:text-slate-400 mt-2">Ask a question about municipal rules, acts, or GRs.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative group ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
                }`}>
                  
                  {/* EDIT MODE */}
                  {editingMsgId === msg.id && msg.role === 'user' ? (
                    <div className="flex flex-col gap-2 min-w-[250px]">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-blue-700 dark:bg-blue-800 text-white border-none rounded p-2 focus:ring-2 focus:ring-white/50 resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingMsgId(null)} className="p-1.5 bg-blue-700 hover:bg-blue-800 rounded text-white"><X className="w-4 h-4"/></button>
                        <button onClick={() => submitEdit(msg.id)} className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded"><Check className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`prose prose-sm max-w-none ${msg.role === 'ai' ? 'dark:prose-invert prose-slate' : 'text-white'}`}>
                        {msg.role === 'ai' ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</div>
                        )}
                      </div>
                      
                      {msg.role === 'ai' && (
                        <div className="absolute -right-12 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => speakText(msg.content)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full"
                            title="Read aloud"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(msg.content)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full"
                            title="Copy text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {msg.role === 'user' && !editingMsgId && (
                        <button 
                          onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }}
                          className="absolute -left-10 top-2 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit message"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  
                  {msg.role === 'ai' && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Sources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cit, idx) => (
                          <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm">
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
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 animate-pulse' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
              }`}
              title="Use Voice Typing"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all text-slate-700 dark:text-slate-200"
                disabled={loading || !sessionId}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || !sessionId}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
