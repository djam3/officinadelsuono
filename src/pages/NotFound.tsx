import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onNavigate: (page: string) => void;
}

export function NotFound({ onNavigate }: NotFoundProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <p className="text-[8rem] font-black text-brand-orange leading-none tracking-tighter mb-4">404</p>
        <h1 className="text-2xl font-black uppercase tracking-tight mb-4">Pagina non trovata</h1>
        <p className="text-zinc-400 mb-10 leading-relaxed">
          La pagina che stai cercando non esiste o è stata spostata. Torna alla home o esplora il nostro catalogo.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
          >
            <Home className="w-5 h-5" />
            Torna alla Home
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className="flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all border border-white/10"
          >
            Vai allo Shop
          </button>
        </div>
      </motion.div>
    </div>
  );
}
