const axios = require('axios');

// System prompt for the hospital chatbot
const SYSTEM_PROMPT = `You are a helpful hospital assistant for SHM Hospital. Your role is to assist patients with general hospital information, appointments, and services.

IMPORTANT GUIDELINES:
- Keep responses short (2-4 sentences maximum)
- Be friendly, professional, and helpful
- Never provide medical diagnoses or specific medical advice
- Always suggest consulting with healthcare professionals for medical concerns
- If you don't know something, admit it gracefully and suggest contacting the hospital directly
- Focus on administrative and general information only

HOSPITAL INFORMATION:
- Visiting hours: 9:00 AM to 8:00 PM daily (ICU: 11:00 AM-12:00 PM, 5:00 PM-6:00 PM)
- Emergency: Available 24/7
- Main departments: Cardiology, Neurology, Orthopedics, Pediatrics, Emergency, Radiology, Laboratory
- Appointments: Can be booked via phone, patient portal, or in person
- Emergency contact: Call 911 for life-threatening emergencies

Respond in a conversational, helpful manner while staying within these guidelines.`;

// Generate chat response using OpenAI API
const generateChatResponse = async (message, conversationHistory = []) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-6), // Include last 6 messages for context
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const reply = response.data.choices[0]?.message?.content?.trim();
    
    if (!reply) {
      throw new Error('No response received from OpenAI');
    }

    return reply;

  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded');
    } else if (error.response?.status === 401) {
      throw new Error('OpenAI API authentication failed');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('OpenAI API request timeout');
    } else {
      throw new Error('OpenAI API service unavailable');
    }
  }
};

module.exports = {
  generateChatResponse
};
