import { ArrowRight, MessageCircle, ShieldCheck, Settings, SlidersHorizontal, Speaker, Mic2, Cable, Sparkles, Award, Package, Users, Headphones, Monitor, Radio, Star, CheckCircle } from 'lucide-react';
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

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const [profileImage, setProfileImage] = useState('/profile_new.jpg');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax: il progresso dello scroll della pagina intera
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  // L'hero si muove più lentamente (parallax)
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  // Le features si muovono con leggero offset
  const featuresY = useTransform(scrollYProgress, [0.5, 1], [40, -20]);

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

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
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
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-10"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <EditableText 
              as="span" 
              contentKey="hero_badge" 
              fallback="Sound Engineer Certificato MAT Academy" 
              className="text-xs md:text-sm font-black tracking-[0.2em] uppercase"
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-[7.5rem] font-black tracking-tighter mb-8 md:mb-12 leading-[1.1] font-display uppercase"
          >
            <EditableText 
              as="span" 
              contentKey="hero_title" 
              fallback="Massimo SPL." 
            /><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-500 drop-shadow-[0_0_20px_rgba(255,100,0,0.3)]">
              <EditableText 
                as="span" 
                contentKey="hero_subtitle" 
                fallback="Zero Distorsione." 
              />
            </span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
            className="text-lg md:text-3xl text-zinc-400 max-w-3xl mx-auto mb-16 md:mb-20 leading-relaxed font-medium tracking-tight"
          >
            <EditableText 
              as="p" 
              contentKey="hero_body" 
              fallback="Setup Ingegnerizzati. Progettiamo catene audio su misura per chi esige performance reali e qualità acustica d'élite." 
              multiline
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4"
          >
            <button 
              onClick={() => onNavigate('shop')}
              className="w-full sm:w-auto px-12 py-5 bg-brand-orange hover:bg-orange-600 text-white rounded-[1.5rem] font-black text-xl transition-all flex items-center justify-center gap-3 group shadow-[0_20px_50px_rgba(255,95,0,0.3)] hover:scale-105 active:scale-95"
            >
              <EditableText 
                as="span" 
                contentKey="hero_cta1" 
                fallback="Accedi all'Arsenale Pro-Audio" 
              />
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform shrink-0" />
            </button>
            
            <a 
              href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Vorrei%20una%20consulenza%20tecnica%20per%20progettare%20il%20mio%20setup%20audio." 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-12 py-5 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-[1.5rem] font-black text-xl transition-all flex items-center justify-center gap-3 border border-white/10 backdrop-blur-md"
            >
              <MessageCircle className="w-6 h-6 text-green-500 shrink-0" />
              <EditableText 
                as="span" 
                contentKey="hero_cta2" 
                fallback="Consulto Tecnico" 
              />
            </a>
          </motion.div>
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
              Non un Altro <span className="text-brand-orange">Negozio Online</span>.
            </h2>
            <p className="text-zinc-500 text-lg md:text-xl max-w-3xl mx-auto font-medium">
              Thomann ha 100.000 prodotti. Amazon ti spedisce in un giorno. Ma nessuno ti dice <strong className="text-white">cosa comprare e perché</strong>. Noi sì.
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
                  className="absolute -bottom-3 -right-3 z-30 bg-black/90 border border-brand-orange/40 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-md"
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
              {[
                {
                  icon: Award,
                  title: "Esperto Certificato",
                  body: "Non un algoritmo, ma un professionista certificato MAT Academy che ha testato ogni prodotto sul campo.",
                  highlight: "Certificazione MAT Academy",
                  delay: 0
                },
                {
                  icon: Package,
                  title: "Catalogo Curato",
                  body: "Non 100.000 prodotti a caso. Solo attrezzatura selezionata e approvata personalmente da un esperto.",
                  highlight: "Solo il meglio, testato da noi",
                  delay: 0.15
                },
                {
                  icon: MessageCircle,
                  title: "Consulenza Gratuita",
                  body: "15 minuti di consulenza gratuita su WhatsApp per scegliere il setup perfetto per te.",
                  highlight: "15 min gratis su WhatsApp",
                  delay: 0.3
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: item.delay, ease: [0.19, 1, 0.22, 1] }}
                >
                  <div className="flex gap-5 p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-brand-orange/30 transition-all duration-300 group">
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

      {/* AI Quiz Banner */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <TiltCard intensity={10}>
            <div className="p-8 md:p-16 rounded-[3rem] bg-gradient-to-br from-brand-orange/20 to-zinc-950 border border-brand-orange/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,95,0,0.1),transparent_50%)]" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 mb-8 backdrop-blur-md">
                    <Sparkles className="w-4 h-4" />
                    <EditableText as="span" contentKey="quiz_badge" fallback="Nuovo Strumento AI" className="text-xs font-black uppercase tracking-[0.2em]" />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
                    <EditableText as="span" contentKey="quiz_title1" fallback="Non sai da dove iniziare?" /><br />
                    <EditableText as="span" contentKey="quiz_title2" fallback="Prova l'" />
                    <span className="text-brand-orange"><EditableText as="span" contentKey="quiz_title_highlight" fallback="AI Setup Architect" /></span>.
                  </h2>
                  <div className="text-zinc-400 text-xl max-w-xl mx-auto md:mx-0 leading-relaxed">
                    <EditableText as="p" multiline contentKey="quiz_body" fallback="Rispondi a 4 brevi domande sul tuo stile e budget. La nostra intelligenza artificiale ingegnerizzerà il setup perfetto per te in pochi secondi." />
                  </div>
                </div>
                <div className="shrink-0">
                  <button 
                    onClick={() => onNavigate('quiz')}
                    className="px-12 py-6 bg-white text-black hover:bg-zinc-100 rounded-[1.5rem] font-black text-2xl transition-all flex items-center justify-center gap-4 shadow-[0_30px_70px_rgba(255,255,255,0.2)] hover:-translate-y-2 active:scale-95"
                  >
                    <SlidersHorizontal className="w-8 h-8" />
                    <EditableText as="span" contentKey="quiz_cta" fallback="Inizia il Test" />
                  </button>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20 text-center md:text-left">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white uppercase">
                <EditableText as="span" contentKey="cat_title" fallback="Sistemi Audio su Misura" />
              </h2>
              <div className="text-zinc-500 text-xl max-w-2xl font-medium">
                 <EditableText as="p" multiline contentKey="cat_subtitle" fallback="Selezioniamo solo l'attrezzatura d'élite per garantirti massima affidabilità e performance acustica in ogni contesto live." />
              </div>
            </div>
            <button onClick={() => onNavigate('shop')} className="flex items-center gap-3 text-brand-orange hover:text-orange-400 font-black text-lg transition-colors group">
              <EditableText as="span" contentKey="cat_explore" fallback="Esplora tutto il catalogo" />
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { id: 'cat1', type: 'controller' as const, fallbackTitle: "Console & Mixer", fallbackDesc: "Sistemi professionali per performance digitali", fallbackImg: "https://assets.alphatheta.com/page-assets/djm-v5/assets/djmv5-product-specification-image-01.webp", isCover: false },
              { id: 'cat2', type: 'speaker' as const, fallbackTitle: "Impianti PA", fallbackDesc: "Sistemi di diffusione ad alta pressione", fallbackImg: "https://www.rcf.it/documents/20124/26930472/woofer-background.jpg/01e81bcc-d8c8-33d0-515f-1625abce4e8f?t=1733310296162&download=true", isCover: true },
              { id: 'cat3', type: 'mixer' as const, fallbackTitle: "Cuffie Pro", fallbackDesc: "Monitoraggio critico e isolamento", fallbackImg: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?q=80&w=500&auto=format&fit=crop", isCover: true },
              { id: 'cat4', type: 'accessories' as const, fallbackTitle: "Microfoni & Studio", fallbackDesc: "Trasduzione ad alta fedeltà", fallbackImg: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=500&auto=format&fit=crop", isCover: true }
            ].map((cat, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: idx * 0.15, ease: [0.19, 1, 0.22, 1] }}
                className="w-full"
              >
                <TiltCard intensity={12} className="h-full">
                  <div
                    onClick={() => onNavigate('shop')}
                    className="group cursor-pointer relative overflow-hidden rounded-[3rem] border border-white/5 aspect-[4/5.5] flex flex-col justify-end p-8 hover:border-brand-orange/40 transition-all duration-700 bg-zinc-900/30 backdrop-blur-md shadow-2xl"
                  >
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 z-0 scale-100 group-hover:scale-110 transition-transform duration-1000 ease-out">
                      <EditableMedia 
                        contentKey={`${cat.id}_img`}
                        fallbackRaw={cat.fallbackImg}
                        fallbackType="image"
                        className="w-full h-full"
                        imgClassName={`w-full h-full transition-all duration-700 pointer-events-none ${cat.isCover ? 'object-cover opacity-50' : 'object-contain p-12 opacity-30'}`}
                      />
                    </div>
                    <div className="relative z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-3xl font-black mb-3 text-white italic tracking-tighter">
                        <EditableText contentKey={`${cat.id}_title`} fallback={cat.fallbackTitle} as="span" />
                      </h3>
                      <div className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <EditableText contentKey={`${cat.id}_desc`} fallback={cat.fallbackDesc} as="span" />
                      </div>
                      <div className="flex items-center gap-4 text-brand-orange text-xs font-black uppercase tracking-[0.3em] overflow-hidden">
                        <span className="w-10 h-[2px] bg-brand-orange -translate-x-full group-hover:translate-x-0 transition-transform duration-500 origin-left" />
                        <span className="translate-x-[-45px] group-hover:translate-x-0 transition-transform duration-500">Scopri</span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Curati — Bundle Teaser */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
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
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-8">
                Pacchetti pre-configurati con <strong className="text-white">compatibilita garantita</strong> tra tutti i componenti.
                Ogni setup e testato sul campo da un esperto certificato. Nessun competitor italiano lo offre.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Componenti selezionati e testati personalmente",
                  "Compatibilita garantita tra ogni elemento",
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
              Non sai cosa scegliere? Scrivimi su WhatsApp e in <strong className="text-white">15 minuti</strong> ti aiuto a configurare il setup perfetto per il tuo budget e le tue esigenze.
            </p>
            <p className="text-zinc-600 text-sm mb-10">
              Nessun impegno. Nessun costo. Solo il consiglio di un esperto certificato.
            </p>
            <a
              href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20Vorrei%20una%20consulenza%20gratuita%20per%20scegliere%20il%20mio%20setup%20DJ."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xl transition-all shadow-[0_15px_40px_rgba(34,197,94,0.25)] hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
              Scrivimi su WhatsApp
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
