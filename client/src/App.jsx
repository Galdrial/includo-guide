import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Sparkles, User, Loader2, RotateCcw } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

// API configuration based on local server port
const API_BASE = 'http://localhost:3001/api';

/**
 * MAIN APPLICATION COMPONENT
 * Handles the state, conversation flow, and RAG-enabled chat interface.
 */
function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // SESSION PERSISTENCE: Retrieve or generate a unique sessionId from localStorage
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('includo_sid');
    if (saved) return saved;
    const newId = 'sid_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('includo_sid', newId);
    return newId;
  });

  const scrollRef = useRef(null);

  /**
   * AUTO-SCROLL LOGIC
   * Ensures the latest message is always visible.
   */
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * INITIALIZATION EFFECT
   * Loads conversation history from the server to maintain persistence across reloads.
   */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/history/${sessionId}`);
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
        } else {
          // Initialize with a warm welcome message if no history exists
          setMessages([{
            role: 'assistant',
            content: "Ciao! Benvenuto in IncluDO Guide. Sono qui per aiutarti a scoprire il tuo talento artigianale nelle nostre aree di eccellenza: Legno, Tessuti, Ceramica, Pelle e Natura. Vuoi raccontarmi un po' cosa ti piace fare con le mani o quali sono i tuoi interessi?"
          }]);
        }
      } catch (err) {
        console.error("Critical error loading history:", err);
      }
    };
    fetchHistory();
  }, [sessionId]);

  /**
   * MESSAGE SUBMISSION HANDLER
   * Sends user input to the backend and updates the UI with the AI response.
   */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/chat`, {
        message: input,
        sessionId: sessionId
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error("Chat Interaction Error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Ops, c'è stato un piccolo errore tecnico. Riprova tra un momento!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER SECTION: Title and Session Reset */}
      <header>
        <Motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="header-container"
        >
          <div className="title-group">
            <h1>Inclu<span>DO</span> Guide</h1>
            <p className="tagline">Costruiamo ponti tra tradizioni e opportunità.</p>
          </div>
          <button 
            className="reset-chat-btn"
            onClick={() => setShowResetModal(true)}
            title="Reset Conversation"
          >
            <RotateCcw size={16} /> Nuova Chat
          </button>
        </Motion.div>
      </header>

      {/* CHAT INTERFACE: Message History & Input */}
      <main className="chat-window">
        <div className="messages-area" ref={scrollRef}>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <Motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
              >
                <div className="sender-info">
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  <span>{msg.role === 'user' ? 'Tu' : 'IncluDO Guide'}</span>
                </div>
                <div className="bubble">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </Motion.div>
            ))}
          </AnimatePresence>
          
          {/* VISUAL FEEDBACK: Loading indicator for AI generation */}
          {isLoading && (
            <div className="message bot loading">
              <div className="bubble">
                <Loader2 className="animate-spin" size={20} />
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA: Text input and Send button */}
        <form onSubmit={sendMessage} className="input-area">
          <input 
            type="text" 
            placeholder="Scrivi qui la tua risposta..."
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
            <Send size={24} />
          </button>
        </form>
      </main>

      {/* FOOTER: Credit and Branding */}
      <footer style={{ textAlign: 'center', padding: '1rem', color: '#95a5a6', fontSize: '0.8rem' }}>
        &copy; 2026 IncluDO Project - Preservare il futuro attraverso il passato.
      </footer>

      {/* MODAL SYSTEM: Custom Glassmorphism confirmation for session reset */}
      <AnimatePresence>
        {showResetModal && (
          <Motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div 
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <h3>Ricominciare da zero?</h3>
              <p>Questa azione cancellerà lo storico attuale della conversazione e genererà una nuova sessione.</p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowResetModal(false)}>Annulla</button>
                <button className="btn-confirm" onClick={() => {
                  localStorage.removeItem('includo_sid');
                  window.location.reload();
                }}>Conferma Reset</button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
