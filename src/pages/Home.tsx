import { ArrowRight, MessageCircle, ShieldCheck, Award, Package, Star, CheckCircle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Logo } from '../components/Logo';
import { HeroBackground } from '../components/HeroBackground';
import { MouseGlow } from '../components/MouseGlow';
import { BUSINESS, waLink } from '../config/site';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const DIFFERENTIATORS = [
  {
    icon: Award,
    title: 'Esperto certificato',
    body: 'Consulenza tecnica specializzata firmata da un Sound Engineer con Certificazione MAT Academy.',
    highlight: 'Certificazione MAT Academy',
  },
  {
    icon: Package,
    title: 'Attrezzatura professionale',
    body: 'Solo hardware audio/DJ di livello professionale, controllato e testato prima di ogni consegna.',
    highlight: 'Marchi professionali',
  },
  {
    icon: MessageCircle,
    title: 'Assistenza diretta su WhatsApp',
    body: 'Sempre raggiungibile per una consulenza gratuita o per un chiarimento tecnico, senza intermediari.',
    highlight: 'Risposta in 15 minuti',
  },
];

export function Home({ onNavigate }: HomeProps) {
  useSEO({
    title: `${BUSINESS.name} — ${BUSINESS.tagline}`,
    description: BUSINESS.description,
    url: '/',
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax: il progresso dello scroll della pagina intera
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  // L'hero si muove più lentamente (parallax)
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden">
      <MouseGlow />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-20 md:pt-24 md:pb-24 overflow-hidden">
        <HeroBackground />
        {/* Parallax wrapper per il contenuto hero */}
        <motion.div className="absolute inset-0 z-[1]" style={{ y: heroY }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="flex justify-center mb-8 md:mb-12 pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                filter: ["brightness(1) blur(0px)", "brightness(1.5) blur(2px)", "brightness(1) blur(0px)"],
              }}
              transition={{
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <Logo className="w-20 h-20 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(255,100,0,0.5)]" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-6"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="text-xs md:text-sm font-black tracking-[0.2em] uppercase">
              Sound Engineer Certificato MAT Academy
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-[6.5rem] font-black tracking-tighter mb-5 md:mb-7 leading-[1.05] font-display uppercase"
          >
            Il suono giusto<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-500 drop-shadow-[0_0_20px_rgba(255,100,0,0.3)] text-shimmer">
              per ogni progetto.
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
            className="text-lg md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed font-medium tracking-tight"
          >
            {BUSINESS.description}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4"
          >
            <a
              href={waLink(`Ciao! Vorrei una consulenza tecnica.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium w-full sm:w-auto px-12 py-5 bg-brand-orange hover:bg-orange-600 text-white rounded-[1.5rem] font-black text-xl transition-all flex items-center justify-center gap-3 group shadow-[0_20px_50px_rgba(255,95,0,0.3)] hover:scale-105 active:scale-95 glow-pulse"
            >
              Scrivimi su WhatsApp
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform shrink-0" />
            </a>

            <button
              onClick={() => onNavigate('contact')}
              className="w-full sm:w-auto px-12 py-5 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-[1.5rem] font-black text-xl transition-all flex items-center justify-center gap-3 border border-white/10 backdrop-blur-md"
            >
              <MessageCircle className="w-6 h-6 text-green-500 shrink-0" />
              Contattaci
            </button>
          </motion.div>
        </div>
      </section>

      {/* Prove Sociali — Social Proof Bar */}
      <section className="py-10 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              { value: 'MAT', label: 'Certificazione Academy' },
              { value: '15 min', label: 'Consulenza gratuita' },
              { value: BUSINESS.area, label: 'Zona di attività' },
              { value: '100%', label: 'Clienti soddisfatti' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-black text-brand-orange tracking-tighter">{stat.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-bold mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perché Sceglierci — Competitive Differentiators */}
      <section className="py-24 md:py-32 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,95,0,0.04),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 md:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-8">
              <Star className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Cosa Ci Rende Diversi</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
              Non è la solita <span className="text-brand-orange">attrezzatura audio</span>.
            </h2>
            <p className="text-zinc-500 text-lg md:text-xl max-w-3xl mx-auto font-medium">
              Ogni consiglio nasce da esperienza diretta sul campo. <strong className="text-white">Ti aiutiamo a scegliere bene, senza fretta e senza fregature.</strong>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Image — Amerigo al mixer (foto originale animata) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
              className="relative flex justify-center"
            >
              <div className="relative group">
                {/* Glow animato dietro l'immagine */}
                <motion.div
                  className="absolute -inset-4 bg-brand-orange/15 blur-[60px] rounded-3xl"
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [0.9, 1.05, 0.9],
                  }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                />
                {/* Container con bordo e overflow hidden */}
                <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  {/* Gradient overlay leggero per blend con sfondo scuro */}
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  {/* Bordo luminoso animato */}
                  <motion.div
                    className="absolute inset-0 z-30 rounded-3xl pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 30px rgba(255,95,0,0.1)' }}
                    animate={{
                      boxShadow: [
                        'inset 0 0 30px rgba(255,95,0,0.05)',
                        'inset 0 0 50px rgba(255,95,0,0.15)',
                        'inset 0 0 30px rgba(255,95,0,0.05)',
                      ],
                    }}
                    transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                  />
                  {/* Immagine con slow zoom continuo */}
                  <motion.img
                    src="/amerigo_hero.png"
                    alt="Amerigo De Cristofaro al mixer"
                    className="relative w-full max-w-lg mx-auto block"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
                  />
                </div>
                {/* Badge MAT Academy sovrapposto */}
                <motion.div
                  className="absolute -bottom-3 -right-3 z-30 bg-black/90 border border-brand-orange/40 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-md badge-shine"
                  initial={{ opacity: 0, scale: 0, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8, ease: "backOut" }}
                >
                  <Award className="w-4 h-4 text-brand-orange" />
                  <span className="text-xs font-black text-brand-orange uppercase tracking-wider">MAT Certified</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Competitive Advantages */}
            <div className="space-y-6">
              {DIFFERENTIATORS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.19, 1, 0.22, 1] }}
                >
                  <div className="flex gap-5 p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-brand-orange/30 transition-all duration-300 group card-hover-glow">
                    <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/20 transition-colors">
                      <item.icon className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black mb-1 uppercase tracking-tight">{item.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-2">{item.body}</p>
                      <span className="inline-flex items-center gap-1.5 text-brand-orange text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {item.highlight}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Consulenza Gratuita CTA */}
      <section className="py-20 md:py-28 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.05),transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
              <MessageCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 uppercase">
              Consulenza <span className="text-green-500">Gratuita</span>
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
              Non sai cosa scegliere? Scrivimi su WhatsApp e in <strong className="text-white">15 minuti</strong> ti aiuto a trovare la soluzione giusta per le tue esigenze.
            </p>
            <p className="text-zinc-600 text-sm mb-10">
              Nessun impegno. Nessun costo. Solo il consiglio di un esperto certificato.
            </p>
            <a
              href={waLink('Ciao! Vorrei una consulenza gratuita.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium inline-flex items-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xl transition-all shadow-[0_15px_40px_rgba(34,197,94,0.25)] hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
              Scrivimi su WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Sticky Button */}
      <a
        href={waLink('Ciao! Vorrei una consulenza tecnica.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrivici su WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.6)] transition-all duration-300 group overflow-hidden"
      >
        {/* Icona sempre visibile */}
        <span className="flex items-center justify-center w-14 h-14 shrink-0">
          <MessageCircle className="w-7 h-7" />
        </span>
        {/* Label che si espande su hover (solo desktop) */}
        <span className="hidden md:block max-w-0 group-hover:max-w-[160px] overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out pr-0 group-hover:pr-5 text-sm font-black">
          Chiedimi consiglio
        </span>
      </a>
    </div>
  );
}
