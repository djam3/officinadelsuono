import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { EditableText } from './builder/EditableText';

interface AISetupBannerProps {
  onNavigate: (page: string) => void;
}

export function AISetupBanner({ onNavigate }: AISetupBannerProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-brand-orange/10 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <div className="relative group p-8 md:p-16 rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="absolute -inset-[2px] bg-gradient-to-br from-white/20 via-transparent to-brand-orange/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-brand-orange" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Advanced AI Simulation</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-[calc(-0.04em)]">
                <span className="text-white">Non sai da dove iniziare? </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">Prova l'AI Setup Architect.</span>
              </h2>
              
              <div className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto md:mx-0 leading-relaxed mb-10">
                <EditableText as="p" contentKey="ai_banner_text" fallback="Rispondi a 4 brevi domande sul tuo stile e budget. La nostra intelligenza artificiale ingegnerizzerà il setup perfetto per te in pochi secondi." />
              </div>
            </div>

            <div className="shrink-0">
               <button 
                onClick={() => onNavigate('quiz')}
                className="group relative px-10 py-6 bg-white text-black hover:bg-zinc-100 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span>Inizia il Test Gratuito</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
