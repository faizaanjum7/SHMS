import React, { useState, useRef, useEffect, FormEvent } from 'react';
import axios from 'axios';
import './ChatBot.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const CHATBOT_API_URL = 'http://localhost:5000/api/chat';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Hello! I'm your SHM Hospital assistant. How can I help you today?", 
      sender: 'bot' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsTyping(true);

    try {
      const response = await axios.post(CHATBOT_API_URL, {
        message: currentInput
      });

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.data.reply,
        sender: 'bot'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      let errorMessage = 'Sorry, I encountered an error. Please make sure the chatbot server is running.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Could not connect to chatbot server. Please ensure it is running on port 5000.';
      }
      
      setError(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const event = new Event('submit') as unknown as FormEvent;
      handleSendMessage(event);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chat-widget">
      <button 
        className="chat-button" 
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <h3>🏥 SHM Hospital Assistant</h3>
          <button 
            className="close-button" 
            onClick={toggleChat}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="message bot">
              <div className="error-message">
                {error}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isTyping}
            aria-label="Type your message"
          />
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
