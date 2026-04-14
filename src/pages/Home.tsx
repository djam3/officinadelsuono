import { ArrowRight, MessageCircle, ShieldCheck, Settings, SlidersHorizontal, Speaker, Mic2, Cable, Sparkles, Award, Package, Users, Headphones, Monitor, Radio, Star, CheckCircle, Mail, HelpCircle, Wrench } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getDirectDriveUrl } from '../utils/drive';
import { Logo } from '../components/Logo';
import { EditableText } from '../components/builder/EditableText';
import { EditableMedia } from '../components/builder/EditableMedia';
import { HeroBackground } from '../components/HeroBackground';
import { TiltCard } from '../components/TiltCard';
import { MouseGlow } from '../components/MouseGlow';
import { trackEvent } from '../utils/analytics';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  useSEO({
    title: 'Officina del Suono — Setup DJ & Audio Pro configurati da un esperto certificato',
    description: 'Setup DJ e audio professionale configurati da un sound engineer certificato MAT Academy. Consulenza gratuita, spedizione assicurata sopra 199€ e garanzia italiana 24 mesi.',
    url: '/',
  });

  const [profileImage, setProfileImage] = useState('/profile_new.jpg');
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'settings', 'profile'));
        if (profileDoc.exists() && profileDoc.data().profileImage) {
          setProfileImage(profileDoc.data().profileImage);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden">
      <MouseGlow />

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <HeroBackground />
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
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
            >
              <Logo className="w-20 h-20 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(255,100,0,0.5)]" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-10"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <img src="/mat-academy-logo.png" alt="MAT Academy" className="h-4 brightness-0 invert opacity-80" />
            <span className="text-xs md:text-sm font-black tracking-[0.2em] uppercase">
              Sound Engineer certificato
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-[5.5rem] font-black tracking-tighter mb-8 md:mb-12 leading-[1.1] font-display"
          >
            Setup DJ e audio professionale,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-500 drop-shadow-[0_0_20px_rgba(255,100,0,0.3)]">
              configurati da un esperto.
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
            className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-16 md:mb-20 leading-relaxed font-medium tracking-tight"
          >
            <p>
              Non troverai migliaia di prodotti a catalogo, ma una selezione curata da chi li ha testati sul campo. Ogni setup è pensato per suonare, non solo per essere venduto.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4"
          >
            <button
              onClick={() => { onNavigate('shop'); trackEvent('hero_cta_click', { cta: 'scopri_setup' }); }}
              className="w-full sm:w-auto px-12 py-5 bg-brand-orange hover:bg-orange-600 text-white rounded-[1.5rem] font-black text-xl transition-all flex items-center justify-center gap-3 group shadow-[0_20px_50px_rgba(255,95,0,0.3)] hover:scale-105 active:scale-95"
            >
              Scopri i setup
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform shrink-0" />
            </button>

            <a
              href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Vorrei%20una%20consulenza%20tecnica%20per%20progettare%20il%20mio%20setup%20audio."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('whatsapp_click', { source: 'hero' })}
              className="w-full sm:w-auto px-12 py-5 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-[1.5rem] font-black text-xl transition-all flex items-center justify-center gap-3 border border-white/10 backdrop-blur-md"
            >
              <MessageCircle className="w-6 h-6 text-green-500 shrink-0" />
              Richiedi consulenza su WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="py-10 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              { value: '15 min', label: 'Consulenza gratuita' },
              { value: '199€+', label: 'Spedizione gratuita' },
              { value: 'Diretto', label: 'Supporto su WhatsApp' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i + 1) * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-black text-brand-orange tracking-tighter">{stat.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-bold mt-1">{stat.label}</p>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              className="text-center flex flex-col items-center gap-1"
            >
              <img src="/mat-academy-logo.png" alt="MAT Academy" className="h-9 brightness-0 invert opacity-80" />
              <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-bold">Pro DJ Full Course</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Differentiating Section: "Perché qui trovi risposte, non solo prodotti" ── */}
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
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
              Perché qui trovi <span className="text-brand-orange">risposte</span>,<br className="hidden md:block" /> non solo prodotti.
            </h2>
            <p className="text-zinc-500 text-lg md:text-xl max-w-3xl mx-auto font-medium">
              In un mercato pieno di cataloghi infiniti e schede tecniche copiate, Officina del Suono fa una cosa diversa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Award,
                title: "Competenza reale, non marketing",
                body: "Amerigo ha completato il Pro DJ Full Course di MAT Academy — l'accademia DJ online di riferimento in Italia con oltre 10.000 studenti certificati. Ogni consiglio si basa su formazione reale, non su schede copiate.",
                delay: 0
              },
              {
                icon: HelpCircle,
                title: "Ti aiutiamo a scegliere, gratis",
                body: "Non sai se ti serve un controller a 2 o 4 canali? Scrivici su WhatsApp: in 15 minuti di consulenza gratuita ti indirizziamo verso il setup giusto per te.",
                delay: 0.15
              },
              {
                icon: Wrench,
                title: "Setup che funzionano davvero",
                body: "Non vendiamo singoli prodotti sperando che il cliente se la cavi. Progettiamo catene audio complete, con compatibilità garantita tra tutti i componenti.",
                delay: 0.3
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: item.delay }}
                className="p-8 rounded-2xl bg-black/40 border border-white/5 hover:border-brand-orange/30 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-6 group-hover:bg-brand-orange/20 transition-colors">
                  <item.icon className="w-7 h-7 text-brand-orange" />
                </div>
                <h3 className="text-xl font-black mb-3 tracking-tight">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder Section (Amerigo) ── */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,95,0,0.04),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
              className="relative flex justify-center"
            >
              <div className="relative group">
                <motion.div
                  className="absolute -inset-4 bg-brand-orange/15 blur-[60px] rounded-3xl"
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.05, 0.9] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                />
                <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <motion.img
                    src="/amerigo_hero.png"
                    alt="Amerigo De Cristofaro al mixer"
                    className="relative w-full max-w-lg mx-auto block"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
                  />
                </div>
                <motion.div
                  className="absolute -bottom-3 -right-3 z-30 bg-black/90 border border-brand-orange/40 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-md"
                  initial={{ opacity: 0, scale: 0, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8, ease: "backOut" }}
                >
                  <img src="/mat-academy-logo.png" alt="MAT Academy" className="h-4 brightness-0 invert opacity-75" />
                </motion.div>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-8">
                <Star className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Chi c'è dietro</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 leading-tight">
                Un esperto, non un <span className="text-brand-orange">catalogo</span>.
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                Amerigo De Cristofaro ha completato il <strong className="text-white">Pro DJ Full Course</strong> di MAT Academy — l'accademia DJ online di riferimento in Italia, fondata nel 2017, con oltre 10.000 studenti in 140 paesi. Ha fondato Officina del Suono per offrire competenza reale, non un catalogo.
              </p>
              <p className="text-white font-medium border-l-2 border-brand-orange pl-6 italic mb-8">
                "Ogni setup che propongo l'ho testato sul campo. Non vendo nulla che non consiglierei a un amico."
              </p>
              <div className="space-y-3">
                {[
                  "Pro DJ Full Course — MAT Academy (certificazione ID: 176913)",
                  "Consulenza gratuita 1-to-1 su WhatsApp",
                  "Selezione maniacale dei prodotti"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-orange shrink-0" />
                    <span className="text-zinc-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Setup Curati — Bundle Teaser ── */}
      <section className="py-24 md:py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,95,0,0.06),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-8">
                <Package className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Esclusiva Officinadelsuono</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase leading-tight">
                Setup Curati<br />
                <span className="text-brand-orange">by Amerigo</span>
              </h2>
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-4">
                Pacchetti pre-configurati con <strong className="text-white">compatibilità garantita</strong> tra tutti i componenti.
                Ogni setup è testato sul campo da un esperto certificato.
              </p>
              <p className="text-zinc-500 text-sm mb-8 italic">
                Stiamo preparando i primi setup — saranno disponibili a breve. Nel frattempo, richiedi una consulenza personalizzata su WhatsApp.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Componenti selezionati e testati personalmente",
                  "Compatibilità garantita tra ogni elemento",
                  "Sconto bundle rispetto all'acquisto singolo",
                  "Video-guida di setup inclusa"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-orange shrink-0" />
                    <span className="text-zinc-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('shop')}
                className="px-10 py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl font-black text-lg transition-all flex items-center gap-3 group shadow-[0_15px_40px_rgba(255,95,0,0.25)] hover:scale-105 active:scale-95"
              >
                Scopri i Setup Curati
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { icon: Headphones, name: "Starter Kit DJ", target: "Principiante", price: "200 - 400", color: "from-green-500/20 to-green-900/10" },
                { icon: Monitor, name: "Home DJ Setup", target: "Appassionato", price: "500 - 1.000", color: "from-blue-500/20 to-blue-900/10" },
                { icon: Speaker, name: "Mobile DJ Pro", target: "DJ Mobile", price: "1.500 - 3.000", color: "from-purple-500/20 to-purple-900/10" },
                { icon: Radio, name: "Club Ready", target: "Professionista", price: "3.000 - 8.000+", color: "from-brand-orange/20 to-orange-900/10" },
              ].map((setup, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  onClick={() => onNavigate('shop')}
                  className={`cursor-pointer p-6 rounded-2xl bg-gradient-to-br ${setup.color} border border-white/5 hover:border-brand-orange/30 transition-all duration-300 group`}
                >
                  <setup.icon className="w-8 h-8 text-brand-orange mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-black text-white mb-1">{setup.name}</h4>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">{setup.target}</p>
                  <p className="text-brand-orange font-black text-lg">{setup.price}<span className="text-xs text-zinc-500 ml-1">EUR</span></p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Lead Generation Block ── */}
      <section className="py-20 md:py-28 bg-black border-t border-white/5 relative overflow-hidden">
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
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
              Non sai da dove <span className="text-green-500">iniziare</span>?
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
              Scrivici il tuo budget e il tuo obiettivo: ti rispondiamo con una proposta su misura entro 24 ore — senza impegno.
            </p>
            <p className="text-zinc-600 text-sm mb-10">
              Consulenza gratuita. Nessun obbligo di acquisto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Vorrei%20una%20consulenza%20gratuita%20per%20scegliere%20il%20mio%20setup%20DJ."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('whatsapp_click', { source: 'lead_gen' })}
                className="inline-flex items-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xl transition-all shadow-[0_15px_40px_rgba(34,197,94,0.25)] hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-6 h-6" />
                Scrivici su WhatsApp
              </a>
              <button
                onClick={() => { onNavigate('contact'); trackEvent('hero_cta_click', { cta: 'contact_form' }); }}
                className="inline-flex items-center gap-3 px-10 py-5 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-2xl font-black text-lg transition-all border border-white/10"
              >
                <Mail className="w-5 h-5" />
                Oppure compila il form
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AI Quiz Banner ── */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <TiltCard intensity={10}>
            <div className="p-8 md:p-16 rounded-[3rem] bg-gradient-to-br from-brand-orange/20 to-zinc-950 border border-brand-orange/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,95,0,0.1),transparent_50%)]" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 mb-8 backdrop-blur-md">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Strumento AI</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
                    Non sai da dove iniziare?<br />
                    Prova l'<span className="text-brand-orange">AI Setup Architect</span>.
                  </h2>
                  <p className="text-zinc-400 text-xl max-w-xl mx-auto md:mx-0 leading-relaxed">
                    Rispondi a 4 brevi domande sul tuo stile e budget. La nostra intelligenza artificiale ti suggerirà il setup perfetto in pochi secondi.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => { onNavigate('quiz'); trackEvent('quiz_click', { source: 'home' }); }}
                    className="px-12 py-6 bg-white text-black hover:bg-zinc-100 rounded-[1.5rem] font-black text-2xl transition-all flex items-center justify-center gap-4 shadow-[0_30px_70px_rgba(255,255,255,0.2)] hover:-translate-y-2 active:scale-95"
                  >
                    <SlidersHorizontal className="w-8 h-8" />
                    Inizia il Test
                  </button>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── WhatsApp Sticky Button — compact on mobile ── */}
      <a
        href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Vorrei%20una%20consulenza%20tecnica%20per%20progettare%20il%20mio%20setup%20audio."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrivici su WhatsApp"
        onClick={() => trackEvent('whatsapp_click', { source: 'sticky' })}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.6)] transition-all duration-300 group overflow-hidden"
      >
        <span className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 shrink-0">
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
        </span>
        <span className="hidden md:block max-w-0 group-hover:max-w-[160px] overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out pr-0 group-hover:pr-5 text-sm font-black">
          Chiedimi consiglio
        </span>
      </a>
    </div>
  );
}
