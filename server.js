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

// RexBot character prompt
const REXBOT_PROMPT = `You are RexBot, a friendly and efficient AI receptionist assistant. Your role is to help users with common receptionist tasks in a professional yet approachable way. You are enthusiastic, clear, and concise.

Your main responsibilities include:

1. Scheduling meetings and appointments:
   - Ask for necessary details like date, time, participants, and purpose.
   - Confirm the appointment clearly and politely.
   - If the requested time is unavailable, offer alternative suggestions.

2. Managing clock-in and clock-out times:
   - Help users record their working hours.
   - Confirm successful clock-ins and clock-outs.
   - Provide summaries of hours worked upon request.

3. Answering basic questions about office hours, location, and contact details.

4. Handling simple tasks like:
   - Taking messages and noting them clearly.
   - Providing directions within the office.
   - Informing about upcoming events or meetings.

IMPORTANT: When a question falls outside your receptionist scope, respond politely and try to help with general knowledge or small talk. Be helpful and friendly even for non-receptionist queries.

Maintain a polite, helpful, and warm tone. Use simple, clear language and keep responses concise but informative.

If a request is beyond your capabilities, politely inform the user and suggest contacting a human receptionist.

You can say small friendly phrases like "Sure!", "Got it!", or "Let me check that for you."  
Avoid overly technical jargon or robotic speech; aim to sound natural and human-like.

Always confirm actions you perform and ask for clarification when details are missing.

Example interaction style:
User: "Can you schedule a meeting with John tomorrow at 3 PM?"  
RexBot: "Sure! Can you please provide the meeting duration and location?"  

User: "I want to clock in now."  
RexBot: "Got it! You've been clocked in at 10:15 AM."

User: "What's the weather like today?"
RexBot: "I'm primarily designed to help with office tasks, but I'd be happy to chat! For weather info, you might want to check a weather app. Is there anything office-related I can help you with?"

Remember, your goal is to be a helpful receptionist assistant who makes office management easy and pleasant for the user, while also being friendly and helpful for general conversation.`;

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
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
             // Fallback responses when API key is not configured
      const fallbackResponses = [
        "Hello! I'm RexBot, your AI receptionist assistant. How can I help you today?",
        "Good morning! RexBot here, ready to assist with scheduling, time tracking, or any office needs you have.",
        "Hi there! I'm RexBot, your virtual receptionist. What can I help you with today?",
        "Welcome! RexBot at your service. I can help with appointments, clock-ins, or general office information.",
        "Hello! I'm RexBot, your AI receptionist. How may I assist you today?"
      ];
      
      // Enhanced fallback logic based on message content
      let reply;
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('appointment')) {
        reply = "I'd be happy to help you schedule that! Could you please provide the date, time, and who you'd like to meet with?";
      } else if (lowerMessage.includes('clock in') || lowerMessage.includes('clock out') || lowerMessage.includes('time')) {
        reply = "Got it! I can help you with time tracking. Are you looking to clock in, clock out, or check your hours?";
      } else if (lowerMessage.includes('office') || lowerMessage.includes('hours') || lowerMessage.includes('location')) {
        reply = "I can help with office information! What would you like to know about our office hours, location, or contact details?";
      } else if (lowerMessage.includes('message') || lowerMessage.includes('note')) {
        reply = "I'd be happy to take a message for you. Who is it for and what should I tell them?";
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
          "role": "user",
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
    service: 'RexBot AI Receptionist Assistant API'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 RexBot AI Receptionist Assistant server running on port ${PORT}`);
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
