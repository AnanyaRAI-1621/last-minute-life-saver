import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquare, Volume2, VolumeX, X, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export const VoiceAssistant = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: `Hi ${user?.name || 'there'}! I'm your Life Saver Assistant. Ask me 'What should I do now?' or 'Which task is urgent?'.` }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleSend(transcript);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech function
  const speakText = (text) => {
    if (isMuted) return;
    // Cancel active speech
    window.speechSynthesis?.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis?.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis?.cancel(); // Mute assistant if speaking
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textToSend) => {
    const activeText = textToSend || query;
    if (!activeText.trim()) return;

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: activeText }]);
    setQuery('');
    setLoading(true);

    try {
      // POST to /api/ai/voice-assistant
      const response = await api.post('/api/ai/voice-assistant', { query: activeText }, token);
      
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: response.textResponse,
        action: response.suggestedAction,
        target: response.actionTargetId
      }]);

      // Speak answer
      speakText(response.textResponse);
    } catch (error) {
      console.error('Voice assistant error:', error);
      const errMsg = 'Sorry, I encountered an issue processing your request. Please try again.';
      setMessages(prev => [...prev, { sender: 'assistant', text: errMsg }]);
      speakText(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-brand-600 focus:outline-none animate-pulse-slow border-2 border-white/20 glow-indigo"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Expanded Assistant Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl shadow-2xl glass border border-white/10 overflow-hidden flex flex-col h-[450px] transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className="p-4 bg-brand-600 dark:bg-brand-700 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-sm">Life Saver Companion</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={isMuted ? 'Unmute Assistant' : 'Mute Assistant'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 dark:bg-dark-bg/40">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}

                  {/* Dynamic actionable shortcut tags inside chat bubbles */}
                  {msg.action && msg.action !== 'none' && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-border/50 flex flex-wrap gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand-500 dark:text-brand-400">
                        Suggested Action:
                      </span>
                      <a
                        href={msg.action === 'view-planner' ? '#/planner' : '#/tasks'}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors"
                      >
                        <Play className="h-2.5 w-2.5 mr-1" />
                        {msg.action.replace('-', ' ')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[80%] flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-xs pl-2">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Listening Pulse Waveform Indicator */}
          {isListening && (
            <div className="px-4 py-2 bg-brand-500/10 border-t border-brand-500/20 flex items-center justify-between text-xs text-brand-600 dark:text-brand-400">
              <span className="animate-pulse">Listening, speak now...</span>
              <div className="flex space-x-0.5 items-end h-3">
                <div className="w-0.5 bg-brand-500 animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                <div className="w-0.5 bg-brand-500 animate-bounce h-3" style={{ animationDelay: '200ms' }} />
                <div className="w-0.5 bg-brand-500 animate-bounce h-1.5" style={{ animationDelay: '400ms' }} />
                <div className="w-0.5 bg-brand-500 animate-bounce h-2.5" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          )}

          {/* Form Input Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card flex items-center space-x-2">
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                  : 'bg-gray-50 border-gray-200 dark:bg-dark-input dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'ENTER' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 bg-gray-50 dark:bg-dark-input text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => handleSend()}
              className="p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VoiceAssistant;
