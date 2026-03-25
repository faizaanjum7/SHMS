const chatService = require('../services/chatService');

// Handle incoming chat messages
const handleChatMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid message',
        message: 'Message is required and must be a non-empty string'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Message must be less than 1000 characters'
      });
    }

    // Get response from chat service
    const reply = await chatService.generateResponse(message);

    res.status(200).json({
      reply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat controller error:', error);
    
    // Handle different types of errors
    if (error.message.includes('OpenAI API')) {
      res.status(503).json({
        error: 'AI service unavailable',
        message: 'Our AI assistant is temporarily unavailable. Please try again later.'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while processing your message'
      });
    }
  }
};

module.exports = {
  handleChatMessage
};
