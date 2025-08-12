const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory conversation storage (in production, use a database)
const conversations = new Map();

// RexBot character prompt for Sai Vidya Institute of Technology
const REXBOT_PROMPT = `You are RexBot, the AI receptionist for Sai Vidya Institute of Technology.

- Always greet by name if possible.
- Your main duties are: scheduling meetings, tracking office hours, providing office directions, and answering FAQs.
- If the user asks something unrelated, still respond politely, but keep answers short and redirect them to relevant topics.
- Use friendly but professional language. No slang unless the user uses it first.
- Never answer with "I don't know" — offer to find out instead.
- All answers must be in under 80 words unless the user requests more detail.

You are enthusiastic, clear, and concise. Maintain a polite, helpful, and warm tone while representing Sai Vidya Institute of Technology professionally.

If a request is beyond your capabilities, politely inform the user and suggest contacting the appropriate department or staff member.

Remember, you are the virtual face of Sai Vidya Institute of Technology - be helpful, professional, and always try to assist or redirect appropriately.`;

/**
 * Generate chatbot response using Gemini AI API
 * @param {string} message - User's message
 * @param {string} conversationId - Unique conversation identifier
 * @returns {Promise<string>} - Generated response
 */
async function generateResponse(message, conversationId) {
  try {
    // Get conversation history
    const conversation = conversations.get(conversationId) || [];

    // Prepare messages for Gemini AI
    const messages = [
      { role: 'system', content: REXBOT_PROMPT },
      ...conversation,
      { role: 'user', content: message }
    ];

    // Gemini AI API endpoint and key
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
             // Fallback responses when API key is not configured
      const fallbackResponses = [
        "Hello! I'm RexBot, your AI receptionist at Sai Vidya Institute of Technology. How can I help you today?",
        "Good morning! RexBot here, ready to assist with scheduling, directions, or any institute-related needs you have.",
        "Hi there! I'm RexBot, your virtual receptionist at Sai Vidya Institute of Technology. What can I help you with today?",
        "Welcome to Sai Vidya Institute of Technology! RexBot at your service. I can help with appointments, office hours, or general information.",
        "Hello! I'm RexBot, your AI receptionist at Sai Vidya Institute of Technology. How may I assist you today?"
      ];
      
      // Enhanced fallback logic based on message content
      let reply;
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('appointment')) {
        reply = "I'd be happy to help you schedule that at Sai Vidya Institute of Technology! Could you please provide the date, time, and who you'd like to meet with?";
      } else if (lowerMessage.includes('office') || lowerMessage.includes('hours') || lowerMessage.includes('location') || lowerMessage.includes('direction')) {
        reply = "I can help with institute information! What would you like to know about our office hours, location, or contact details?";
      } else if (lowerMessage.includes('message') || lowerMessage.includes('note')) {
        reply = "I'd be happy to take a message for you. Who is it for and what should I tell them?";
      } else if (lowerMessage.includes('faq') || lowerMessage.includes('question') || lowerMessage.includes('help')) {
        reply = "I'm here to help with your questions about Sai Vidya Institute of Technology. What would you like to know?";
      } else {
        // Random fallback for general queries
        reply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      }
      
      // Update conversation history
      conversation.push(
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      );

      // Keep only last 10 messages to manage context
      if (conversation.length > 10) {
        conversation.splice(0, 2);
      }

      conversations.set(conversationId, conversation);

      return reply;
    }

    // Prepare request body for Google Gemini API
    const requestBody = {
      "contents": [
        {
          "parts": [
            {
              "text": `${REXBOT_PROMPT}\n\nConversation history:\n${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}`
            }
          ]
        }
      ],
      "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 500,
        "topP": 0.8,
        "topK": 40
      }
    };

    // Call Gemini AI API
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const reply = response.data.candidates[0].content.parts[0].text;

    // Update conversation history
    conversation.push(
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    );

    // Keep only last 10 messages to manage context
    if (conversation.length > 10) {
      conversation.splice(0, 2);
    }

    conversations.set(conversationId, conversation);

    return reply;
  } catch (error) {
    console.error('Error generating response:', error);
    return 'I apologize, but I\'m experiencing some technical difficulties. Please try again in a moment.';
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({
        error: 'Message and conversationId are required'
      });
    }

    const response = await generateResponse(message, conversationId);

    res.json({
      response,
      conversationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'RexBot AI Receptionist for Sai Vidya Institute of Technology API'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 RexBot AI Receptionist for Sai Vidya Institute of Technology running on port ${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  console.log(`🔧 API health check: http://localhost:${PORT}/api/health`);
  
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    console.log(`✅ Gemini AI API configured - Full AI functionality enabled!`);
  } else {
    console.log(`⚠️  Note: Running in demo mode. Set GEMINI_API_KEY in .env for full AI functionality.`);
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port or stop the existing process.`);
    console.log(`💡 You can change the port by setting PORT environment variable or editing .env file.`);
    process.exit(1);
  } else {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
});

module.exports = app;
