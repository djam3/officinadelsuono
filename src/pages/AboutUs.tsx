import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { Award, Star, ShieldCheck, CheckCircle, MessageCircle, Package, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { trackEvent } from '../utils/analytics';

interface AboutUsProps {
  onNavigate?: (page: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps) {
  useSEO({
    title: 'Chi Siamo — La storia di Officina del Suono e di Amerigo De Cristofaro',
    description: 'Amerigo De Cristofaro, DJ certificato MAT Academy, ha fondato Officina del Suono per offrire competenza reale, non solo un catalogo. Scopri la nostra storia.',
    url: '/chi-siamo',
  });

  const [profileImage, setProfileImage] = useState('/profile_new.jpg');

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
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero: "Più di un negozio online." ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">La Nostra Storia</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
              Più di un <span className="text-brand-orange">negozio online</span>.
            </h1>

            <div className="space-y-6 text-lg text-zinc-400 leading-relaxed">
              <p>
                Officina del Suono nasce dall'idea che chi compra attrezzatura audio meriti di più di un catalogo infinito e una scheda tecnica copiata.
              </p>
              <p>
                <strong className="text-white">Amerigo De Cristofaro</strong>, DJ certificato MAT Academy, ha fondato questo progetto con una missione precisa: offrire competenza reale, selezione curata e supporto diretto a chi cerca un setup che funziona davvero.
              </p>
              <p className="text-white font-medium border-l-2 border-brand-orange pl-6 italic">
                "Non ho aperto un e-commerce per riempire un catalogo. L'ho fatto perché quando cercavo attrezzatura trovavo tutto tranne risposte chiare."
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-orange/10 blur-3xl rounded-full"></div>
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/5]">
              <img
                src="/amerigo_hero.png"
                alt="Amerigo De Cristofaro al mixer"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent">
                <p className="text-white font-bold text-xl">Amerigo De Cristofaro</p>
                <p className="text-zinc-400 text-sm">Founder & DJ certificato MAT Academy</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Cosa ci rende diversi ── */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
              Cosa ci rende <span className="text-brand-orange">diversi</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: "Competenza certificata",
                body: "Ogni consiglio che ricevi si basa su formazione reale (MAT Academy) e ore di test sul campo, non su schede copiate dal distributore."
              },
              {
                icon: HelpCircle,
                title: "Consulenza gratuita",
                body: "Non ti lasciamo solo con un catalogo. 15 minuti di consulenza su WhatsApp per capire cosa ti serve davvero — gratis, senza impegno."
              },
              {
                icon: Package,
                title: "Setup completi e testati",
                body: "Non vendiamo singoli prodotti sperando che funzionino insieme. Progettiamo catene audio complete con compatibilità garantita."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-black/40 border border-white/5 hover:border-brand-orange/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-brand-orange" />
                </div>
                <h3 className="text-lg font-black mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── MAT Certificate ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 bg-zinc-900/30 rounded-3xl p-8 md:p-16 border border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-white/10 mb-6">
              <ShieldCheck className="w-4 h-4 text-[#E6007E]" />
              <span className="text-xs font-bold uppercase tracking-wider">Certificazione</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
              La formazione è la tua <span className="text-brand-orange">garanzia</span>.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed mb-4">
              <strong className="text-white">MAT Academy</strong> è l'accademia DJ online di riferimento in Italia, fondata da Alex Tripi e Nello Greco (The ReLoud). Il <strong className="text-white">Pro DJ Full Course</strong> — 23 capitoli, 246 lezioni, 30+ ore — copre l'intero percorso professionale: dalla tecnica alla carriera.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed mb-8">
              Mentori del corso: Pete Tong, Carl Cox, Adam Beyer, Jamie Jones e altri artisti internazionali.
            </p>
            <div className="space-y-3">
              {[
                "Beatmatching, phrasing e transizioni professionali",
                "Mixaggio avanzato: filtri, effetti, loop, hot cue e mix in chiave",
                "Setup Pioneer CDJ, DDJ, controller e mixer — configurazione e ottimizzazione",
                "Costruzione set per club, festival ed eventi — lettura del pubblico",
                "Organizzazione record box e ricerca tracce (Beatport Streaming)",
                "Aspetti professionali: carriera, social media, networking"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-orange shrink-0" />
                  <span className="text-zinc-300 font-medium text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
            whileHover={{ scale: 1.02, rotate: 0 }}
            className="order-1 lg:order-2 relative p-[2px] rounded-2xl bg-gradient-to-br from-[#E6007E] via-brand-orange to-zinc-800 shadow-[0_0_50px_rgba(242,125,38,0.15)] group transition-all duration-500"
          >
            <div className="bg-zinc-950 p-8 md:p-12 rounded-xl border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,125,38,0.05),transparent_70%)]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent"></div>
              <Award className="absolute -right-12 -bottom-12 w-64 h-64 text-white/[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />

              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center mb-6">
                    <img src="/mat-academy-logo.png" alt="MAT Academy" className="h-14 brightness-0 invert opacity-90" />
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="h-[1px] w-8 bg-zinc-800"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Attestato di Partecipazione</h3>
                    <div className="h-[1px] w-8 bg-zinc-800"></div>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] mb-6 italic">Si attesta che lo studente</p>
                  <p className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-8">
                    Amerigo <span className="text-brand-orange italic">De Cristofaro</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] mb-4">Ha completato con successo il master</p>
                  <div className="inline-block px-6 py-2 rounded-full bg-brand-orange/5 border border-brand-orange/20">
                    <p className="text-xl md:text-2xl font-mono font-bold text-brand-orange tracking-tighter">Pro DJ Academy [Full Course]</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
                  <div className="text-left">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Data di Rilascio</p>
                    <p className="text-lg font-bold text-white">28 Febbraio 2025</p>
                    <p className="text-[9px] font-mono text-zinc-600 mt-1">VERIFIED ID: 176913-176522</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-end">
                    <div className="mb-2">
                      <p className="font-serif text-xl text-white italic leading-none">Alex Tripi & Nello Greco</p>
                      <div className="h-[1px] w-32 bg-gradient-to-l from-brand-orange/50 to-transparent mt-2"></div>
                    </div>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Fondatori MAT Academy</p>
                  </div>
                </div>

                <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-40 transition-opacity">
                  <ShieldCheck className="w-12 h-12 text-brand-orange" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl bg-zinc-900/50 border border-brand-orange/20 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Vuoi parlare con Amerigo?</h3>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Consulenza gratuita e senza impegno. Scrivici il tuo budget e il tuo obiettivo — ti rispondiamo con una proposta su misura.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/393477397016"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('whatsapp_click', { source: 'about' })}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Scrivici su WhatsApp
            </a>
            {onNavigate && (
              <button
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all border border-white/10"
              >
                Compila il form contatti
              </button>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
