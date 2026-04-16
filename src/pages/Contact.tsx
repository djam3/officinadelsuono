import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, ChevronDown, Send, Loader2 } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

const FAQS = [
  {
    question: "Quali sono i tempi di consegna?",
    answer: "Le spedizioni vengono effettuate tramite corriere espresso assicurato. I tempi di consegna variano solitamente da 24 a 48 ore lavorative in tutta Italia, isole comprese."
  },
  {
    question: "La spedizione è gratuita?",
    answer: "Sì, offriamo la spedizione assicurata gratuita su tutti gli ordini sopra i 199€. Per ordini inferiori, il costo viene calcolato al checkout."
  },
  {
    question: "I prodotti hanno garanzia italiana?",
    answer: "Certamente. Tutti i nostri prodotti sono nuovi e godono della Garanzia Italiana ufficiale di 24 mesi fornita direttamente dai produttori."
  },
  {
    question: "Offrite consulenza per la scelta del setup?",
    answer: "Sì, Amerigo e il nostro team di esperti sono a disposizione per consulenze personalizzate tramite WhatsApp o email per aiutarti a configurare il setup perfetto per le tue esigenze."
  },
  {
    question: "Quali metodi di pagamento accettate?",
    answer: "Accettiamo pagamenti sicuri tramite Carta di Credito/Debito, Google Pay, Apple Pay, Klarna (per il pagamento in 3 rate senza interessi) e Bonifico Bancario."
  }
];

function FAQItem({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-brand-orange' : 'text-white group-hover:text-brand-orange'}`}>
          {question}
        </span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-orange' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-zinc-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Contact() {
  useSEO({
    title: 'Contatti — Parlaci del tuo progetto audio | Officina del Suono',
    description: 'Scrivici per una consulenza gratuita sul tuo setup DJ o audio professionale. Risposta entro 24 ore via email o in tempo reale su WhatsApp.',
    url: '/contatti',
  });

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    budget: '',
    usage: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    setFormError('');

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setFormStatus('error');
      setFormError('Compila tutti i campi obbligatori.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus('error');
      setFormError('Inserisci un indirizzo email valido.');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Errore durante l\'invio.');
      }

      const data = await res.json();
      setTicketId(data.ticketId || null);
      setFormStatus('success');
      setFormData({ name: '', email: '', message: '', budget: '', usage: '' });
      trackEvent('form_submit', { form: 'contact' });
    } catch (err) {
      setFormStatus('error');
      setFormError(err instanceof Error ? err.message : 'Errore durante l\'invio. Riprova.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4 text-center">
            Contatti
          </h1>
          <p className="text-zinc-500 text-center max-w-2xl mx-auto mb-12">
            Hai un progetto in mente? Scrivici — ti rispondiamo entro 24 ore con una proposta su misura.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-24">
            {/* Contact Form */}
            <div className="lg:col-span-3 glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">Scrivici un messaggio</h2>

              {formStatus === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Messaggio inviato!</h3>
                  {ticketId && (
                    <p className="text-brand-orange font-mono font-bold mb-2">Ticket: {ticketId}</p>
                  )}
                  <p className="text-zinc-400">Ti risponderemo entro 24 ore. Conserva il numero di ticket per riferimento.</p>
                  <button
                    onClick={() => setFormStatus('idle')}
                    className="mt-6 text-brand-orange font-bold hover:text-white transition-colors"
                  >
                    Invia un altro messaggio
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-zinc-300 mb-2">
                      Nome *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors"
                      placeholder="Il tuo nome"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-bold text-zinc-300 mb-2">
                      Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors"
                      placeholder="la-tua@email.it"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-bold text-zinc-300 mb-2">
                      Messaggio *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors resize-none"
                      placeholder="Raccontaci di cosa hai bisogno..."
                    />
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-budget" className="block text-sm font-bold text-zinc-300 mb-2">
                        Budget indicativo <span className="text-zinc-500 font-normal">(opzionale)</span>
                      </label>
                      <select
                        id="contact-budget"
                        value={formData.budget}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors"
                      >
                        <option value="">Seleziona...</option>
                        <option value="< 500€">&lt; 500€</option>
                        <option value="500€ - 1.500€">500€ - 1.500€</option>
                        <option value="1.500€ - 4.000€">1.500€ - 4.000€</option>
                        <option value="> 4.000€">&gt; 4.000€</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-usage" className="block text-sm font-bold text-zinc-300 mb-2">
                        Utilizzo <span className="text-zinc-500 font-normal">(opzionale)</span>
                      </label>
                      <select
                        id="contact-usage"
                        value={formData.usage}
                        onChange={(e) => setFormData(prev => ({ ...prev, usage: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors"
                      >
                        <option value="">Seleziona...</option>
                        <option value="Casa / Hobby">Casa / Hobby</option>
                        <option value="DJ Mobile / Eventi">DJ Mobile / Eventi</option>
                        <option value="Club / Locale">Club / Locale</option>
                        <option value="Studio / Produzione">Studio / Produzione</option>
                        <option value="Altro">Altro</option>
                      </select>
                    </div>
                  </div>

                  {formStatus === 'error' && formError && (
                    <p className="text-red-400 text-sm font-medium">{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === 'sending'}
                    className="w-full px-8 py-4 bg-brand-orange hover:bg-orange-600 disabled:bg-zinc-700 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2"
                  >
                    {formStatus === 'sending' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Invia messaggio
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar: company info + WhatsApp */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-3xl p-8">
                <h2 className="text-xl font-bold mb-6 text-brand-orange">Dati Aziendali</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Sede Operativa</p>
                      <p className="text-zinc-400 text-sm">Officinadelsuono di Amerigo De Cristofaro<br />Strada provinciale 30<br />Forino (AV) 83020</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">WhatsApp Business</p>
                      <a href="https://wa.me/393477397016" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-white transition-colors text-sm">
                        +39 347 7397016
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Email Supporto</p>
                      <a href="mailto:info@officina-del-suono.it" className="text-brand-orange hover:text-white transition-colors text-sm">
                        info@officina-del-suono.it
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Orari</p>
                      <p className="text-zinc-400 text-sm">
                        Lun-Ven 09:00 - 18:00<br />
                        WhatsApp: sempre attivo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-8 text-center">
                <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Risposta immediata?</h3>
                <p className="text-zinc-400 text-sm mb-5">
                  Scrivici su WhatsApp per una consulenza in tempo reale.
                </p>
                <a
                  href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Ti%20scrivo%20dal%20sito%20Officinadelsuono."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { source: 'contact_page' })}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chatta su WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
                Domande <span className="text-brand-orange">Frequenti</span>
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Tutto quello che devi sapere su spedizioni, garanzia e il nostro servizio di consulenza specializzata.
              </p>
            </div>

            <div className="glass rounded-[2rem] p-8 md:p-12 max-w-4xl mx-auto">
              <div className="divide-y divide-white/5">
                {FAQS.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
