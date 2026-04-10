import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Sparkles, User, Loader2, RotateCcw } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('includo_sid');
    if (saved) return saved;
    const newId = 'sid_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('includo_sid', newId);
    return newId;
  });

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/history/${sessionId}`);
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
        } else {
          setMessages([{
            role: 'assistant',
            content: "Ciao! Benvenuto in IncluDO Guide. Sono qui per aiutarti a scoprire il tuo talento artigianale. Le nostre aree di eccellenza sono: **Legno, Tessuti, Ceramica, Pelle e Natura**. Dimmi pure: quale di queste ti piacerebbe esplorare?"
          }]);
        }
      } catch (err) {
        console.error("History fetch failed:", err);
      }
    };
    fetchHistory();
  }, [sessionId]);

  const resetChat = async () => {
    try {
      await axios.post(`${API_BASE}/reset`, { sessionId });
      setMessages([{
        role: 'assistant',
        content: "Reset completato! Iniziamo da zero. Le nostre aree sono: **Legno, Tessuti, Ceramica, Pelle e Natura**. Quale ti incuriosisce di più?"
      }]);
      setShowResetModal(false);
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

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
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Errore di connessione. Riprova!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header role="banner">
        <div className="header-container">
          <div className="title-group">
            <h1>Inclu<span>DO</span> Guide</h1>
            <p className="tagline">Tradizione artigiana, opportunità sociale.</p>
          </div>
          <button 
            className="reset-chat-btn" 
            onClick={() => setShowResetModal(true)}
            aria-label="Nuova conversazione"
          >
            <RotateCcw size={16} aria-hidden="true" /> Nuova Chat
          </button>
        </div>
      </header>

      <main className="chat-window" role="log" aria-live="polite">
        <div className="messages-area" ref={scrollRef}>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <Motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
                role="article"
                aria-label={msg.role === 'user' ? "Messaggio inviato da te" : "Risposta di IncluDO Guide"}
              >
                <div className="sender-info" aria-hidden="true">
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  <span>{msg.role === 'user' ? 'Tu' : 'IncluDO Guide'}</span>
                </div>
                <div className="bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </Motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="message bot loading" role="status" aria-label="Caricamento risposta">
              <div className="bubble">
                <Loader2 className="animate-spin" size={20} />
              </div>
            </div>
          )}
        </div>

        <form className="input-area" onSubmit={sendMessage} role="search">
          <input 
            ref={inputRef}
            className="chat-input"
            type="text" 
            placeholder={isLoading ? "Sto elaborando i tuoi dati..." : "Scrivi qui il tuo messaggio..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            aria-label="Campo di inserimento messaggio"
          />
          <button 
            className="send-btn" 
            type="submit" 
            disabled={!input.trim() || isLoading}
            aria-label="Invia messaggio"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      </main>

      {showResetModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <Motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal-card"
          >
            <h3 id="modal-title">Reset Chat</h3>
            <p>Sei sicuro di voler ricominciare? Perderai la cronologia attuale.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowResetModal(false)}
                aria-label="Annulla reset"
              >
                Annulla
              </button>
              <button 
                className="btn-confirm" 
                onClick={resetChat}
                aria-label="Conferma reset della chat"
              >
                Sì, resetta
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </div>
  );
}

export default App;
