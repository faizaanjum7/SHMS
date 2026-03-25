import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your SHM Hospital assistant. How can I help you today?", 
      sender: 'bot' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/chat', {
        message: inputMessage.trim()
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.reply,
        sender: 'bot'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
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
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            aria-label="Type your message"
          />
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
