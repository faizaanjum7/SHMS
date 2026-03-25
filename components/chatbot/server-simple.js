const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Basic test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'SHM Hospital Chatbot API is running',
    timestamp: new Date().toISOString()
  });
});

// Simple chat route for testing
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const lowerMsg = message.toLowerCase();
  let reply = "I'm here to help you!";
  
  // Basic symptom detection
  if (lowerMsg.includes('chest pain')) {
    reply = "Based on your chest pain, I recommend seeing a Cardiology specialist. Our cardiologists are available for appointments.";
  } else if (lowerMsg.includes('headache')) {
    reply = "For headaches, I recommend seeing a Neurology specialist. Would you like to book an appointment?";
  } else if (lowerMsg.includes('fever')) {
    reply = "For fever symptoms, I recommend seeing a General Medicine specialist or Pediatrician for children.";
  } else if (lowerMsg.includes('skin') || lowerMsg.includes('rash')) {
    reply = "For skin issues, I recommend seeing a Dermatology specialist. Our dermatologists can help with various skin conditions.";
  } else if (lowerMsg.includes('appointment') || lowerMsg.includes('book')) {
    reply = "I can help you book an appointment! Please tell me your symptoms so I can recommend the right doctor.";
  } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    reply = "Hello! Welcome to SHM Hospital. I can help you find doctors and book appointments. What symptoms are you experiencing?";
  }
  
  res.status(200).json({
    reply,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🏥 SHM Hospital Chatbot Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
