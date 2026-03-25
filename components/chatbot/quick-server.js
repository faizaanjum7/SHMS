const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SHM Hospital API running' });
});

// Chat endpoint with symptom detection
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();
  
  let reply = "I'm here to help you!";
  
  // Symptom-based doctor recommendations
  if (lowerMsg.includes('chest pain') || lowerMsg.includes('heart')) {
    reply = "Based on your chest pain, I recommend Dr. Sarah Johnson (Cardiology). She's available Mon, Tue, Wed, Fri. Would you like to book an appointment?";
  } else if (lowerMsg.includes('headache') || lowerMsg.includes('migraine')) {
    reply = "For headaches, I recommend Dr. Michael Chen (Neurology). He's available Mon, Wed, Thu, Fri. Would you like to book an appointment?";
  } else if (lowerMsg.includes('skin') || lowerMsg.includes('rash')) {
    reply = "For skin issues, I recommend Dr. Priya Sharma (Dermatology). She's available Mon, Tue, Wed, Fri, Sat. Would you like to book an appointment?";
  } else if (lowerMsg.includes('fever') || lowerMsg.includes('cold')) {
    reply = "For fever symptoms, I recommend Dr. Ahmed Hassan (General Medicine). He's available Mon-Sat. Would you like to book an appointment?";
  } else if (lowerMsg.includes('child') || lowerMsg.includes('baby')) {
    reply = "For children, I recommend Dr. Emily Rodriguez (Pediatrics). She's available Tue, Wed, Thu, Sat. Would you like to book an appointment?";
  } else if (lowerMsg.includes('joint') || lowerMsg.includes('bone') || lowerMsg.includes('back pain')) {
    reply = "For joint/bone issues, I recommend Dr. James Wilson (Orthopedics). He's available Mon, Tue, Thu, Fri. Would you like to book an appointment?";
  } else if (lowerMsg.includes('appointment') || lowerMsg.includes('book')) {
    reply = "I can help you book an appointment! Please tell me your symptoms so I can recommend the right doctor.";
  } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    reply = "Hello! Welcome to SHM Hospital. Tell me your symptoms and I'll recommend the right specialist and help you book an appointment.";
  }
  
  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`🏥 SHM Hospital Server running on http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/chat`);
});
