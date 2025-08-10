/**
 * RexBot AI Character
 * Frontend JavaScript implementation with speech input and character-based responses
 */

class RexBotCharacter {
    constructor() {
        this.conversationId = this.generateConversationId();
        this.speechEnabled = true;
        this.speechSynthesis = window.speechSynthesis;
        this.speechRecognition = null;
        this.currentUtterance = null;
        this.isProcessing = false;
        this.isListening = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeech();
        this.setWelcomeTime();
        this.updateStatus('Ready');
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.speechInputButton = document.getElementById('speechInputButton');
        this.micIcon = document.getElementById('micIcon');
        this.speechStatusDisplay = document.getElementById('speechStatusDisplay');
        this.chatMessages = document.getElementById('chatMessages');
        this.speechToggle = document.getElementById('speechToggle');
        this.speechIcon = document.getElementById('speechIcon');
        this.speechStatus = document.getElementById('speechStatus');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.modalClose = document.getElementById('modalClose');
        this.modalOk = document.getElementById('modalOk');
        this.cancelButton = document.getElementById('cancelButton');
        this.volumeWaves = document.getElementById('volumeWaves');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Speech input button
        this.speechInputButton.addEventListener('click', () => this.toggleSpeechInput());
        
        // Cancel button
        this.cancelButton.addEventListener('click', () => this.cancelSpeechInput());
        
        // Speech output toggle
        this.speechToggle.addEventListener('click', () => this.toggleSpeechOutput());
        
        // Modal controls
        this.modalClose.addEventListener('click', () => this.hideErrorModal());
        this.modalOk.addEventListener('click', () => this.hideErrorModal());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Click outside modal to close
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.hideErrorModal();
            }
        });
    }

    /**
     * Initialize speech synthesis and recognition
     */
    initializeSpeech() {
        // Initialize speech synthesis
        if (!this.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            this.speechEnabled = false;
            this.updateSpeechUI();
            return;
        }

        // Wait for voices to load
        this.speechSynthesis.onvoiceschanged = () => {
            this.setupVoice();
        };

        // Handle speech end
        this.speechSynthesis.onend = () => {
            this.currentUtterance = null;
        };

        this.setupVoice();

        // Initialize speech recognition
        this.initializeSpeechRecognition();
    }

    /**
     * Initialize speech recognition
     */
    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            this.speechStatusDisplay.textContent = 'Speech recognition not supported';
            return;
        }

        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onstart = () => {
            this.isListening = true;
            this.updateSpeechInputUI('listening');
            this.updateStatus('Listening...');
            this.showCancelButton(true);
            this.showVolumeWaves(true);
        };

        this.speechRecognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update status with interim results
            if (interimTranscript) {
                this.speechStatusDisplay.textContent = `Heard: "${interimTranscript}"`;
            }
            
            // Process final result
            if (finalTranscript) {
                this.handleSpeechInput(finalTranscript);
            }
        };

        this.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateSpeechInputUI('error');
            this.updateStatus('Error');
            this.showCancelButton(false);
            this.showVolumeWaves(false);
            
            if (event.error === 'no-speech') {
                this.speechStatusDisplay.textContent = 'No speech detected. Try again!';
            } else if (event.error === 'network') {
                this.speechStatusDisplay.textContent = 'Network error. Check your connection.';
            } else if (event.error === 'not-allowed') {
                this.speechStatusDisplay.textContent = 'Microphone access denied. Please allow access.';
            } else {
                this.speechStatusDisplay.textContent = 'Speech recognition error. Try again!';
            }
            
            setTimeout(() => {
                this.updateSpeechInputUI('idle');
                this.updateStatus('Ready');
            }, 3000);
        };

        this.speechRecognition.onend = () => {
            this.isListening = false;
            this.updateSpeechInputUI('idle');
            this.updateStatus('Ready');
            this.showCancelButton(false);
            this.showVolumeWaves(false);
        };
    }

    /**
     * Cancel speech input
     */
    cancelSpeechInput() {
        if (this.isListening && this.speechRecognition) {
            this.speechRecognition.stop();
        }
        this.showCancelButton(false);
        this.showVolumeWaves(false);
        this.updateSpeechInputUI('idle');
        this.updateStatus('Ready');
    }

    /**
     * Toggle speech input
     */
    toggleSpeechInput() {
        if (this.isProcessing) return;

        if (this.isListening) {
            this.speechRecognition.stop();
        } else {
            this.speechRecognition.start();
        }
    }

    /**
     * Handle speech input
     */
    async handleSpeechInput(transcript) {
        if (!transcript.trim()) return;

        // Add user message to chat
        this.addMessage(transcript, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Show processing state
        this.setLoading(true);
        this.updateStatus('Processing...');
        this.updateSpeechInputUI('processing');
        
        try {
            // Simulate typing delay for better UX
            await this.delay(1000);
            
            // Send message to API
            const response = await this.sendMessage(transcript);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response to chat
            this.addMessage(response, 'bot');
            
            // Speak the response if speech is enabled
            if (this.speechEnabled) {
                this.speak(response);
            }
            
            this.updateStatus('Ready');
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.showError('Failed to send message. Please try again.');
            this.updateStatus('Error');
        } finally {
            this.setLoading(false);
            this.updateSpeechInputUI('idle');
        }
    }

    /**
     * Send message to backend API
     */
    async sendMessage(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationId: this.conversationId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    }

    /**
     * Add message to chat interface
     */
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.setAttribute('role', 'article');
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const icon = document.createElement('i');
        icon.className = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(icon);
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();
        
        content.appendChild(messageText);
        content.appendChild(time);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Add animation delay for bot messages
        if (sender === 'bot') {
            messageDiv.style.animationDelay = '0.1s';
        }
    }

    /**
     * Speak text using speech synthesis
     */
    speak(text) {
        if (!this.speechSynthesis || !this.speechEnabled) return;
        
        // Stop any current speech
        if (this.currentUtterance) {
            this.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings for RexBot character
        utterance.rate = 0.9; // Slightly slower than default
        utterance.pitch = 1.2; // Slightly higher pitch for robot-like voice
        utterance.volume = 0.9; // High volume
        
        // Get available voices
        const voices = this.speechSynthesis.getVoices();
        let preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('James'))
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        // Store current utterance
        this.currentUtterance = utterance;
        
        // Speak the text
        this.speechSynthesis.speak(utterance);
        
        // Update UI to show speaking state
        this.updateSpeechUI(true);
        
        // Reset UI when speech ends
        utterance.onend = () => {
            this.updateSpeechUI(false);
            this.currentUtterance = null;
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.updateSpeechUI(false);
            this.currentUtterance = null;
        };
    }

    /**
     * Toggle speech synthesis on/off
     */
    toggleSpeechOutput() {
        this.speechEnabled = !this.speechEnabled;
        this.updateSpeechUI();
        
        if (!this.speechEnabled && this.currentUtterance) {
            this.speechSynthesis.cancel();
            this.currentUtterance = null;
        }
    }

    /**
     * Update speech input UI
     */
    updateSpeechInputUI(state) {
        const button = this.speechInputButton;
        const icon = this.micIcon;
        const status = this.speechStatusDisplay;
        
        // Remove all state classes
        button.classList.remove('listening', 'processing');
        status.classList.remove('listening', 'processing');
        
        switch (state) {
            case 'listening':
                button.classList.add('listening');
                status.classList.add('listening');
                icon.className = 'fas fa-stop';
                status.textContent = 'Listening... Speak now!';
                break;
            case 'processing':
                button.classList.add('processing');
                status.classList.add('processing');
                icon.className = 'fas fa-spinner fa-spin';
                status.textContent = 'Processing your message...';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle';
                status.textContent = 'Error occurred. Try again!';
                break;
            default: // idle
                icon.className = 'fas fa-microphone';
                status.textContent = 'Click the microphone to speak';
                break;
        }
    }

    /**
     * Update speech output UI elements
     */
    updateSpeechUI(isSpeaking = false) {
        if (this.speechEnabled) {
            this.speechIcon.className = isSpeaking ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            this.speechStatus.textContent = isSpeaking ? 'RexBot speaking...' : 'RexBot voice enabled';
            this.speechToggle.classList.toggle('active', isSpeaking);
        } else {
            this.speechIcon.className = 'fas fa-volume-mute';
            this.speechStatus.textContent = 'RexBot voice disabled';
            this.speechToggle.classList.remove('active');
        }
    }

    /**
     * Set up the voice for speech synthesis
     */
    setupVoice() {
        const voices = this.speechSynthesis.getVoices();
        
        // Try to find a male voice that sounds robotic
        let preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('James'))
        );
        
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        }
        
        if (preferredVoice) {
            console.log('Using voice:', preferredVoice.name);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Spacebar to toggle speech input
        if (e.code === 'Space' && !this.isProcessing) {
            e.preventDefault();
            this.toggleSpeechInput();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && this.errorModal.classList.contains('show')) {
            this.hideErrorModal();
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isProcessing = loading;
        this.loadingOverlay.classList.toggle('show', loading);
        this.speechInputButton.disabled = loading;
    }

    /**
     * Update status indicator
     */
    updateStatus(status) {
        this.statusText.textContent = status;
        
        // Update status dot color
        this.statusDot.className = 'status-dot';
        switch (status.toLowerCase()) {
            case 'ready':
                this.statusDot.style.background = '#10b981';
                break;
            case 'listening...':
                this.statusDot.style.background = '#ef4444';
                break;
            case 'processing...':
                this.statusDot.style.background = '#f59e0b';
                break;
            case 'error':
                this.statusDot.style.background = '#ef4444';
                break;
        }
    }

    /**
     * Show error modal
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.add('show');
        this.errorModal.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide error modal
     */
    hideErrorModal() {
        this.errorModal.classList.remove('show');
        this.errorModal.setAttribute('aria-hidden', 'true');
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /**
     * Get current time formatted
     */
    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Set welcome message time
     */
    setWelcomeTime() {
        const welcomeTime = document.getElementById('welcomeTime');
        if (welcomeTime) {
            welcomeTime.textContent = this.getCurrentTime();
        }
    }

    /**
     * Generate unique conversation ID
     */
    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Show/hide cancel button
     */
    showCancelButton(show) {
        this.cancelButton.style.display = show ? 'block' : 'none';
    }

    /**
     * Show/hide volume waves
     */
    showVolumeWaves(show) {
        this.volumeWaves.style.display = show ? 'block' : 'none';
    }

    /**
     * Simulate typing delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <span>RexBot is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(typingIndicator);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = this.chatMessages.lastElementChild;
        if (typingIndicator && typingIndicator.classList.contains('typing-indicator')) {
            typingIndicator.remove();
        }
    }
}

// Initialize RexBot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.rexbot = new RexBotCharacter();
        console.log('🚀 RexBot AI Character initialized successfully');
    } catch (error) {
        console.error('Failed to initialize RexBot:', error);
        // Show error to user
        setTimeout(() => {
            if (window.rexbot) {
                window.rexbot.showError('Failed to initialize RexBot. Please refresh the page.');
            }
        }, 1000);
    }
});

// Handle page visibility changes to pause speech when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.rexbot && window.rexbot.speechSynthesis) {
        window.rexbot.speechSynthesis.pause();
    } else if (!document.hidden && window.rexbot && window.rexbot.speechSynthesis) {
        window.rexbot.speechSynthesis.resume();
    }
});

// Handle beforeunload to clean up speech synthesis
window.addEventListener('beforeunload', () => {
    if (window.rexbot && window.rexbot.speechSynthesis) {
        window.rexbot.speechSynthesis.cancel();
    }
});
