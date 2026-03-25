# 🏥 SHM Hospital Chatbot System

An intelligent virtual hospital assistant built with React.js and Node.js, designed to enhance patient experience and reduce manual support workload.

## ✨ Features

- **Conversational AI**: Natural language processing with OpenAI integration
- **Context-Aware**: Session-based memory for maintaining conversation context
- **Real-Time Assistance**: Instant responses to hospital-related queries
- **Mobile Responsive**: Works seamlessly on all devices
- **Production Ready**: Secure, scalable, and modular architecture

## 🎯 Core Capabilities

### Hospital Information
- Visiting hours and department information
- Emergency services availability
- Doctor specializations and availability
- Appointment booking guidance

### Smart Features
- Keyword-based quick responses for common queries
- Fallback handling for unknown questions
- Graceful error handling and recovery
- Typing indicators and smooth animations

## 🛠 Tech Stack

**Frontend**
- React.js 18 with functional components and hooks
- CSS3 with animations and transitions
- Axios for API communication

**Backend**
- Node.js with Express.js
- OpenAI API integration
- Security middleware (Helmet, CORS, Rate Limiting)
- Environment-based configuration

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- OpenAI API key

### 1. Clone and Setup
```bash
git clone <repository-url>
cd windsurf-project-10
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Frontend Setup
```bash
# Install client dependencies
npm run install-client
```

### 4. Run the Application

**Development Mode:**
```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
npm run client
```

**Production Mode:**
```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 🔧 Configuration

### Environment Variables
```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## 📡 API Endpoints

### Chat API
```
POST /api/chat
Content-Type: application/json

Request:
{
  "message": "What are your visiting hours?"
}

Response:
{
  "reply": "Our visiting hours are 9:00 AM to 8:00 PM daily...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Health Check
```
GET /api/health

Response:
{
  "status": "OK",
  "message": "SHM Hospital Chatbot API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🎨 UI Components

### ChatBot Widget
- Floating button (bottom-right corner)
- Expandable chat window
- Message bubbles with user/bot distinction
- Smooth animations and transitions
- Mobile-responsive design

### Key Features
- Real-time typing indicators
- Error message handling
- Auto-scroll to latest messages
- Keyboard support (Enter to send)

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Environment variable protection
- API key security (backend only)

## 🧠 AI Integration

The chatbot uses a hybrid approach:

1. **Keyword-Based Responses**: Fast responses for common queries
2. **OpenAI GPT-3.5**: Complex query understanding and generation
3. **Context Management**: Session-based conversation history
4. **Safety Guidelines**: Medical advice restrictions and fallback handling

## 🚀 Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup API keys

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔮 Future Enhancements

### Planned Features
- Multi-language support
- Voice input/output capabilities
- Patient authentication integration
- Real appointment booking
- Electronic health record integration
- Personalized patient responses

### Scalability Considerations
- Redis for session management
- Database integration for persistent storage
- Load balancing for high traffic
- Microservices architecture
- WebSocket support for real-time updates

## 🐛 Troubleshooting

### Common Issues

**OpenAI API Errors:**
- Verify API key in .env file
- Check API quota and billing
- Ensure network connectivity

**CORS Issues:**
- Verify FRONTEND_URL in .env
- Check development vs production URLs

**Connection Issues:**
- Ensure both servers are running
- Check port conflicts
- Verify firewall settings

### Debug Mode
Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

For technical support:
- Check the troubleshooting section
- Review server logs for error details
- Verify API configurations
- Test with the health check endpoint

---

**Built with ❤️ for SHM Hospital**
