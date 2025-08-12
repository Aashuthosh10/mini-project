# RexBot AI Receptionist for Sai Vidya Institute of Technology

A modern web-based AI receptionist named RexBot with speech input and intelligent responses, specifically designed for Sai Vidya Institute of Technology.

## Features

- 🤖 AI-powered receptionist responses for Sai Vidya Institute of Technology
- 🎤 Speech input for hands-free interaction
- 🗣️ Speech synthesis with RexBot's voice
- 💬 Real-time conversation interface
- 🎨 Modern, responsive UI
- 🔧 Easy setup and configuration
- 📱 Mobile-friendly design

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd rexbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   copy env.example .env
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Configuration

### Demo Mode (Default)

The application runs in demo mode by default, providing pre-configured responses. No API key is required.

### Full AI Mode (Optional)

To enable full AI functionality with Google Gemini:

1. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Edit the `.env` file and replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Usage

- **Click the microphone** to start speaking to RexBot
- **Speak clearly** and wait for RexBot to respond
- **Toggle RexBot's voice** using the volume button
- **Keyboard shortcuts**:
  - `Spacebar`: Toggle speech input
  - `Escape`: Close error modal

## Troubleshooting

### Port Already in Use
If you see `EADDRINUSE` error:
1. Stop any existing Node.js processes: `taskkill /f /im node.exe`
2. Or change the port in `.env`: `PORT=3001`

### API Key Issues
- The app works in demo mode without an API key
- For full AI functionality, ensure your Gemini API key is valid and has proper permissions

### Speech Synthesis
- Speech synthesis requires a modern browser with Web Speech API support
- Some browsers may require HTTPS for speech synthesis to work

## Project Structure

```
rexbot/
├── server.js          # Express server with API endpoints
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (create from env.example)
├── public/           # Frontend files
│   ├── index.html    # Main HTML page
│   ├── styles.css    # CSS styles
│   └── script.js     # Frontend JavaScript
└── README.md         # This file
```

## API Endpoints

- `GET /` - Main application page
- `POST /api/chat` - Send message to chatbot
- `GET /api/health` - Health check endpoint

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Google Gemini API (optional)
- **Speech**: Web Speech API
- **Styling**: Modern CSS with Flexbox/Grid

## License

MIT License - feel free to use this project for learning and development.

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure the server is running on the correct port
4. Check the `.env` file configuration
