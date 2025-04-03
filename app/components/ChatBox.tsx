'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Maximize2, Minimize2, Copy, Check, Code, Download, Zap, MessageSquare, Moon, Sun, History, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SavedQuestion {
  id: string;
  text: string;
  timestamp: Date;
}

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else if (isHistoryOpen) {
          setIsHistoryOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullScreen, isHistoryOpen]);

  // Handle fullscreen mode
  useEffect(() => {
    if (chatBoxRef.current) {
      if (isFullScreen) {
        document.body.style.overflow = 'hidden';
        chatBoxRef.current.style.zIndex = '50';
      } else {
        document.body.style.overflow = '';
        chatBoxRef.current.style.zIndex = '0';
      }
    }
  }, [isFullScreen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    const userMessage: Message = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    
    // Save question to history
    const newQuestion: SavedQuestion = {
      id: Date.now().toString(),
      text: input,
      timestamp: new Date()
    };
    setSavedQuestions(prev => [...prev, newQuestion]);
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          history: messages.slice(-10)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Function to extract code blocks from markdown
  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    const codeBlocks = [];
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2]
      });
    }
    
    return codeBlocks;
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = formatDate(message.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Custom renderer for code blocks
  const CodeBlock = ({ language, value }: CodeBlockProps) => {
    return (
      <div className="relative group rounded-lg overflow-hidden my-4">
        <div className={`flex justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-gray-700'} text-gray-300 px-4 py-2 text-xs font-mono`}>
          <span>{language || 'code'}</span>
          <button
            onClick={() => copyToClipboard(value, Math.random())}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            <Copy size={14} />
          </button>
        </div>
        <SyntaxHighlighter
          language={language || 'javascript'}
          style={darkMode ? vscDarkPlus : oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            borderRadius: '0 0 0.5rem 0.5rem',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    );
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    setIsHistoryOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const deleteQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Group saved questions by date
  const groupQuestionsByDate = () => {
    const groups: { [key: string]: SavedQuestion[] } = {};
    
    savedQuestions.forEach(question => {
      const dateKey = formatDate(question.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(question);
    });
    
    return groups;
  };
  
  return (
    <div 
      ref={chatBoxRef}
      className={`flex flex-col ${
        isFullScreen 
          ? 'fixed inset-0 w-full h-full' 
          : 'h-full md:h-[700px] w-full'
      } ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} rounded-xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-blue-200'} transition-all duration-300 overflow-hidden`}
    >
      {/* Chat Header */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-600 to-violet-500'} text-white p-4 md:p-5 rounded-t-xl flex items-center justify-between sticky top-0 z-10 shadow-lg`}>
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-white'} flex items-center justify-center mr-3 shadow-lg`}>
            <Zap className={`${darkMode ? 'text-blue-900' : 'text-blue-600'} w-7 h-7`} />
          </div>
          <div>
            <h2 className="font-bold text-2xl tracking-tight">Power AI</h2>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
              <p className="text-xs text-blue-100">Siap Membantu Anda</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/20 hover:bg-white/30'} rounded-full p-2 transition-all relative`}
            aria-label="History"
          >
            <History size={18} />
            {savedQuestions.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {savedQuestions.length}
              </div>
            )}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/20 hover:bg-white/30'} rounded-full p-2 transition-all`}
            aria-label={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/20 hover:bg-white/30'} rounded-full p-2 transition-all`}
            aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      
      {/* History Sidebar */}
      <div className={`absolute top-0 bottom-0 right-0 w-full md:w-80 ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-50 pt-20 flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-xl`}>
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="font-medium flex items-center">
            <History size={18} className="mr-2" /> 
            Riwayat Pertanyaan
          </h3>
          <button 
            onClick={() => setIsHistoryOpen(false)}
            className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded-full`}
            aria-label="Close history"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          {savedQuestions.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Belum ada pertanyaan tersimpan</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupQuestionsByDate()).map(([date, questions]) => (
                <div key={date} className="space-y-3">
                  <div className="flex justify-center mb-2">
                    <div className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-800'} text-xs px-3 py-1 rounded-full font-medium`}>
                      {date}
                    </div>
                  </div>
                  
                  {questions.map((question) => (
                    <div 
                      key={question.id}
                      onClick={() => handleQuestionClick(question.text)}
                      className={`p-3 rounded-lg flex items-start justify-between group cursor-pointer ${darkMode ? 'hover:bg-gray-700 bg-gray-750' : 'hover:bg-blue-50 bg-gray-50'} transition-colors`}
                    >
                      <div className="flex-grow pr-2">
                        <p className="text-sm line-clamp-2">{question.text}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatTime(question.timestamp)}</p>
                      </div>
                      <button 
                        onClick={(e) => deleteQuestion(question.id, e)}
                        className={`opacity-0 group-hover:opacity-100 ${darkMode ? 'hover:bg-gray-600 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'} p-1 rounded-full transition-opacity`}
                        aria-label="Delete question"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {savedQuestions.length > 0 && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setSavedQuestions([])}
              className={`w-full py-2 px-4 rounded-lg ${darkMode ? 'bg-red-900 hover:bg-red-800 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'} transition-colors text-sm font-medium`}
            >
              Hapus Semua Riwayat
            </button>
          </div>
        )}
      </div>
      
      {/* Chat Messages */}
      <div className={`flex-grow overflow-y-auto p-4 md:p-6 ${darkMode ? 'scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' : 'scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent'}`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
            <div className={`w-24 h-24 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center shadow-lg`}>
              <Zap className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} w-12 h-12`} />
            </div>
            <div>
              <p className={`font-medium text-2xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mulai chat dengan Power AI!</p>
              <p className={`text-base mt-3 max-w-lg mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Power AI siap membantu Anda dengan berbagai pertanyaan, tugas, dan penulisan kode. Coba tanyakan sesuatu!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mt-6">
              {[
                {
                  icon: <Code size={24} />,
                  title: "Tulis & Jelaskan Kode",
                  description: "Power AI dapat menulis kode dalam berbagai bahasa pemrograman"
                },
                {
                  icon: <MessageSquare size={24} />,
                  title: "Asisten Pintar",
                  description: "Jawaban cepat & akurat untuk berbagai pertanyaan"
                },
                {
                  icon: <Download size={24} />,
                  title: "Proses Data",
                  description: "Analisis data dan konversi format dengan mudah"
                }
              ].map((item, idx) => (
                <div key={idx} className={`flex flex-col items-center p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                  <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-100'} p-3 rounded-lg mb-4`}>
                    <div className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="font-medium text-lg mb-2">{item.title}</h3>
                  <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date} className="space-y-6">
                <div className="flex justify-center">
                  <div className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-200 text-blue-800'} text-xs px-4 py-1.5 rounded-full font-medium`}>
                    {date}
                  </div>
                </div>
                
                {msgs.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center mb-1.5">
                        {msg.role !== 'user' && (
                          <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-700' : 'bg-gradient-to-br from-blue-500 to-violet-500'} flex items-center justify-center text-white text-xs mr-2 shadow-md`}>
                            <Zap size={16} />
                          </div>
                        )}
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {msg.role === 'user' ? 'Anda' : 'Power AI'} • {formatTime(msg.timestamp)}
                        </span>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs ml-2 shadow-md">
                            U
                          </div>
                        )}
                      </div>
                      <div 
                        className={`p-4 rounded-2xl break-words ${
                          msg.role === 'user' 
                            ? `${darkMode ? 'bg-gradient-to-br from-green-600 to-teal-600' : 'bg-gradient-to-br from-green-500 to-teal-500'} text-white rounded-tr-none shadow-lg` 
                            : `${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-blue-100'} ${darkMode ? 'text-gray-100' : 'text-gray-800'} rounded-tl-none shadow-lg`
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                            <ReactMarkdown
                              components={{
                                code: ({node, inline, className, children, ...props}: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline ? (
                                    <CodeBlock
                                      language={match?.[1] || ''}
                                      value={String(children).replace(/\n$/, '')}
                                    />
                                  ) : (
                                    <code className={`${darkMode ? 'bg-gray-700 text-blue-300' : 'bg-blue-50 text-blue-700'} px-1.5 py-0.5 rounded font-mono text-sm`} {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      {/* Code Block Actions */}
                      {msg.role === 'assistant' && extractCodeBlocks(msg.content).length > 0 && (
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => copyToClipboard(extractCodeBlocks(msg.content)[0].code, index)}
                            className={`flex items-center text-xs ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'} px-3 py-1.5 rounded-full transition-colors`}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check size={14} className="mr-1.5" />
                                Disalin
                              </>
                            ) : (
                              <>
                                <Copy size={14} className="mr-1.5" />
                                Salin Kode
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start mt-6">
            <div className="flex flex-col items-start max-w-[85%] md:max-w-[75%]">
              <div className="flex items-center mb-1.5">
                <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-700' : 'bg-gradient-to-br from-blue-500 to-violet-500'} flex items-center justify-center text-white text-xs mr-2 shadow-md`}>
                  <Zap size={16} />
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Power AI • {formatTime(new Date())}</span>
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-blue-100'} shadow-lg min-w-[120px]`}>
                <div className="flex space-x-2">
                  <div className={`w-2.5 h-2.5 ${darkMode ? 'bg-blue-500' : 'bg-blue-500'} rounded-full animate-bounce`}></div>
                  <div className={`w-2.5 h-2.5 ${darkMode ? 'bg-blue-500' : 'bg-blue-500'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`w-2.5 h-2.5 ${darkMode ? 'bg-blue-500' : 'bg-blue-500'} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className={`border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-blue-200 bg-white'} p-4 md:p-5 rounded-b-xl sticky bottom-0 z-10`}>
        <div className="flex items-end">
          <div className={`flex-grow relative ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-xl overflow-hidden focus-within:ring-2 ${darkMode ? 'focus-within:ring-blue-500 focus-within:bg-gray-700' : 'focus-within:ring-blue-400 focus-within:bg-white'} transition-all duration-200 shadow-inner`}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan anda..."
              className={`w-full px-4 py-3.5 resize-none focus:outline-none bg-transparent max-h-[200px] ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={`ml-3 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700' : 'bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600'} text-white p-3.5 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg`}
            disabled={isLoading || input.trim() === ''}
            aria-label="Kirim pesan"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-right`}>
          Tekan Enter untuk kirim, Shift+Enter untuk baris baru
        </div>
      </form>
    </div>
  );
}