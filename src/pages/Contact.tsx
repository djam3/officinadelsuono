import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, ChevronDown } from 'lucide-react';

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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-12 text-center">
            Contatti
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-brand-orange">Dati Aziendali</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Sede Operativa</h3>
                    <p className="text-zinc-400">Officinadelsuono di Amerigo De Cristofaro<br />Strada provinciale 30<br />Forino (AV) 83020</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">WhatsApp Business</h3>
                    <a href="https://wa.me/393477397016" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-white transition-colors">
                      +39 347 7397016
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Email Supporto</h3>
                    <a href="mailto:officinadelsuono99@gmail.com" className="text-brand-orange hover:text-white transition-colors">
                      officinadelsuono99@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Orari di Consulenza</h3>
                    <p className="text-zinc-400">
                      Sempre attivi tramite Chat AI<br />
                      Risposta umana: Lun-Ven 09:00 - 18:00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Hai bisogno di aiuto?</h2>
              <p className="text-zinc-400 mb-8">
                Siamo qui per aiutarti a scegliere il setup perfetto per le tue esigenze. Scrivici su WhatsApp per una risposta immediata.
              </p>
              <a 
                href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Ti%20scrivo%20dal%20sito%20Officinadelsuono." 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chatta su WhatsApp
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
                Domande <span className="text-brand-orange">Frequenti</span>
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Tutto quello che devi sapere su spedizioni, garanzia e il nostro servizio di consulenza specializzata.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl">
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
