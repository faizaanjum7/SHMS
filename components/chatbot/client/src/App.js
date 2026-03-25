import React from 'react';
import ChatBot from './components/ChatBot';
import './index.css';

function App() {
  return (
    <div className="App">
      <div className="demo-container">
        <h1>🏥 SHM Hospital</h1>
        <p>Welcome to our intelligent virtual hospital assistant. Click the chat widget in the bottom-right corner to get started!</p>
      </div>
      <ChatBot />
    </div>
  );
}

export default App;
