import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService } from '../services/chatbotService';
import { useAIFeatures } from '../contexts/AIFeaturesContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  logId?: string | null;
  rated?: boolean;
}

function formatText(text: string) {
  // Render **bold**, *italic*, bullet points
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.replace(/^[-•] /, '');
      return <li key={i} className="ml-3 list-disc">{renderInline(content)}</li>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="leading-relaxed">{renderInline(line)}</p>;
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

export function Chatbot() {
  const { features, loading: featuresLoading } = useAIFeatures();
  const chatbotEnabled = features.consulente_am3?.enabled ?? true;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'model',
      text: 'Ciao! 👋 Sono l\'AI di Officinadelsuono, addestrata sul nostro catalogo in tempo reale.\n\nChiedimi di prodotti, prezzi, brand, spedizioni o supporto tecnico. Come posso aiutarti?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInit, setIsInit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-inizializza il servizio quando la pagina carica
    chatbotService.initialize().then(() => setIsInit(true));
  }, []);

  // Wire admin AI config to chatbot service
  useEffect(() => {
    const cfg = features.consulente_am3;
    chatbotService.configureAI({
      enabled: chatbotEnabled,
      model: cfg?.model || 'claude-haiku-4-5-20251001',
      systemPrompt: cfg?.systemPrompt || '',
    });
  }, [chatbotEnabled, features.consulente_am3?.model, features.consulente_am3?.systemPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Hide if admin disabled this feature (AFTER all hooks)
  if (!featuresLoading && !chatbotEnabled) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await chatbotService.getResponse(userMessage);
      const logId = await chatbotService.logConversation(userMessage, response);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response,
          logId,
          rated: false,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: 'Si è verificato un errore. Riprova o contatta Amerigo su WhatsApp! 📱',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const prodCount = chatbotService.getProductCount();
  const knowCount = chatbotService.getKnowledgeCount();
  const blogCount = chatbotService.getBlogCount();

  return (
    <>
      {/* Pulsante chat */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'} transition-all duration-300`}
      >
        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="glass rounded-xl px-3 py-2 shadow-xl mr-1 group-hover:opacity-0 transition-opacity duration-300"
        >
          <p className="text-[11px] font-bold text-white whitespace-nowrap">Chiedimi qualcosa! 🎧</p>
          <p className="text-[9px] text-zinc-500 whitespace-nowrap">AI su prodotti e guide</p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-3 bg-brand-orange/20 rounded-2xl blur-xl group-hover:bg-brand-orange/35 transition-all duration-500" />

          {/* Bottone principale */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-brand-orange to-orange-600 rounded-2xl shadow-[0_8px_32px_rgba(242,125,38,0.4)] flex flex-col items-center justify-center gap-1.5 z-10 border border-white/10">
            {/* Equalizer bars animate */}
            <div className="flex items-end gap-[3px] h-5">
              {[0.6, 1, 0.75, 1, 0.5].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-white rounded-full"
                  animate={{ scaleY: [h, 1, h * 0.4, 1, h] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  style={{ height: `${h * 20}px`, transformOrigin: 'bottom' }}
                />
              ))}
            </div>
            <span className="text-[8px] font-black text-white/90 tracking-[0.15em] uppercase">AI</span>
          </div>

          {/* Badge online */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-zinc-950 z-20 shadow-lg">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75" />
          </div>
        </motion.button>
      </motion.div>

      {/* Finestra chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[410px] h-[540px] glass-strong rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-black border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 bg-gradient-to-br from-brand-orange to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="flex items-end gap-[2px] h-4">
                      {[0.6, 1, 0.7, 1].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-[2px] bg-white rounded-full"
                          animate={isInit ? { scaleY: [h, 1, h * 0.4, 1, h] } : { scaleY: 1 }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                          style={{ height: `${h * 14}px`, transformOrigin: 'bottom' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${isInit ? 'bg-green-500' : 'bg-zinc-500'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Officinadelsuono AI</h3>
                  <p className="text-[10px] text-zinc-400">
                    {isInit
                      ? `${prodCount} prodotti · ${blogCount} guide · ${knowCount} risposte`
                      : 'Caricamento dati...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Ti%20scrivo%20dal%20sito."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-full border border-[#25D366]/20 transition-all"
                  title="Scrivi su WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">WA</span>
                </a>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors p-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messaggi */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-brand-orange text-white rounded-br-sm'
                        : 'glass-subtle text-zinc-200 rounded-bl-sm'
                    }`}
                  >
                    <div className="space-y-0.5">{formatText(msg.text)}</div>
                  </div>

                  {/* Rating per risposte AI */}
                  {msg.role === 'model' && msg.logId && !msg.rated && msg.id !== '0' && (
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-[10px] text-zinc-600">Utile?</span>
                      <button
                        onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, rated: true } : m))}
                        className="p-1 text-zinc-600 hover:text-green-400 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, rated: true } : m))}
                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-subtle rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />
                    <span className="text-xs text-zinc-400">Ricerca nel catalogo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 glass-subtle border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Es: 'CDJ-3000', 'controller per principianti'..."
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-orange transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 bg-brand-orange hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-zinc-700 text-center mt-2 tracking-wide uppercase">
                AI proprietaria · addestrata sul catalogo Officinadelsuono
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
