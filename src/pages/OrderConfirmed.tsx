import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface OrderConfirmedProps {
  onNavigate: (page: string) => void;
}

export function OrderConfirmed({ onNavigate }: OrderConfirmedProps) {
  useSEO({
    title: 'Ordine Confermato — Officina del Suono',
    description: 'Grazie per il tuo acquisto. Il tuo ordine è stato ricevuto.',
    url: '/ordine-confermato',
  });

  // Imposta meta robots noindex per questa pagina di ringraziamento
  useEffect(() => {
    let el = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    el.setAttribute('content', 'noindex, nofollow');
    return () => {
      // Ripristina indicizzazione normale uscendo dalla pagina
      if (el) el.setAttribute('content', 'index, follow');
    };
  }, []);

  const steps = [
    {
      num: '01',
      text: 'Riceverai conferma via WhatsApp entro 15 minuti',
    },
    {
      num: '02',
      text: 'Coordineremo insieme il pagamento (bonifico o altro)',
    },
    {
      num: '03',
      text: 'Spedizione con tracking entro 24-48h lavorative',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">

        {/* Icona animata */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-brand-orange/20 blur-3xl rounded-full scale-150" />
          <CheckCircle2 className="w-28 h-28 text-brand-orange relative z-10" strokeWidth={1.5} />
        </motion.div>

        {/* Titolo */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4 leading-none"
        >
          Ordine ricevuto! 🎉
        </motion.h1>

        {/* Sottotitolo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-zinc-400 text-base md:text-lg leading-relaxed mb-10 max-w-md"
        >
          Grazie per il tuo acquisto. Amerigo ti contatterà a breve via WhatsApp
          per confermare i dettagli.
        </motion.p>

        {/* Card passi successivi */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full glass rounded-3xl p-8 mb-10 text-left space-y-6"
        >
          <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-[0.35em] mb-6">
            Cosa succede adesso
          </h2>
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-5"
            >
              <span className="text-3xl font-black text-brand-orange/30 leading-none shrink-0 w-10 text-right">
                {s.num}
              </span>
              <p className="text-white font-medium text-sm leading-relaxed pt-1">{s.text}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pulsanti azione */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-4 w-full"
        >
          <button
            onClick={() => onNavigate('shop')}
            className="flex-1 flex items-center justify-center gap-2 h-14 bg-brand-orange text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500 hover:shadow-[0_20px_40px_rgba(242,125,38,0.25)]"
          >
            Continua a esplorare
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="flex-1 flex items-center justify-center h-14 glass rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-white hover:border-white/20 transition-all duration-500"
          >
            Vai al tuo Profilo
          </button>
        </motion.div>

        {/* Link WhatsApp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <a
            href="https://wa.me/393477397016"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-brand-orange transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Hai domande? Scrivici subito
          </a>
        </motion.div>

      </div>
    </div>
  );
}
