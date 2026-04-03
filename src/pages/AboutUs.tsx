import { motion } from 'framer-motion';
import { Award, MapPin, Star, Music, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getDirectDriveUrl } from '../utils/drive';

export function AboutUs() {
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
        
        {/* Hero Section / Storytelling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-6">
              <Music className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">La Nostra Storia</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
              Oltre il Negozio:<br />
              Un <span className="text-brand-orange">Laboratorio</span> di Passione.
            </h1>
            
            <div className="space-y-6 text-lg text-zinc-400 leading-relaxed">
              <p>
                Tutto inizia con una console e un'ossessione: capire perché alcuni setup suonano "bene" e altri semplicemente "forte". <strong>Amerigo De Cristofaro</strong> non ha fondato Officinadelsuono solo per vendere hardware, ma per colmare il vuoto tra il manuale d'istruzioni e la performance reale.
              </p>
              <p className="text-white font-medium border-l-2 border-brand-orange pl-6 italic">
                "Mentre gli altri leggono un manuale, io ho studiato l'ingegneria del suono per darti solo setup che funzionano davvero, testati sul campo e ottimizzati per la tua visione artistica."
              </p>
              <p>
                Nata a <strong>Forino (AV)</strong>, nel cuore dell'Irpinia, Officinadelsuono è oggi il punto di riferimento per chi cerca competenza tecnica reale, supportata da certificazioni internazionali e una selezione maniacale dei brand leader.
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
                <p className="text-zinc-400 text-sm">Founder & DJ Certificato MAT Academy</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Proof of Concept / Certificate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 bg-zinc-900/30 rounded-3xl p-8 md:p-16 border border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-white/10 mb-6">
              <ShieldCheck className="w-4 h-4 text-[#E6007E]" />
              <span className="text-xs font-bold uppercase tracking-wider">Proof of Concept</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
              La formazione è la tua <span className="text-brand-orange">Garanzia</span>.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed mb-8">
              Non ci improvvisiamo esperti. La certificazione <strong>MAT Academy</strong> è il "bollino di qualità" che assicura che ogni consiglio tecnico, ogni cablaggio e ogni configurazione software sia eseguita secondo i più alti standard dell'industria Pro-Audio.
            </p>
            <div className="flex items-center gap-4 text-zinc-300">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center">
                    <Star className="w-4 h-4 text-brand-orange fill-current" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium">Oltre 500 setup configurati con successo.</p>
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
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,125,38,0.05),transparent_70%)]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent"></div>
              <Award className="absolute -right-12 -bottom-12 w-64 h-64 text-white/[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />

              {/* Certificate Content */}
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center gap-3 mb-6">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-8 bg-[#E6007E] transform -skew-x-12"></div>
                      <div className="w-2 h-10 bg-[#E6007E] transform -skew-x-12 -translate-y-1"></div>
                      <div className="w-2 h-8 bg-brand-orange transform -skew-x-12"></div>
                    </div>
                    <span className="text-2xl font-black tracking-[0.2em] text-white">MAT ACADEMY</span>
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

                {/* Seal */}
                <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-40 transition-opacity">
                  <ShieldCheck className="w-12 h-12 text-brand-orange" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Contact CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl bg-zinc-900/50 border border-brand-orange/20 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Pronto per il tuo prossimo Setup?</h3>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">Offriamo consulenza tecnica personalizzata per aiutarti a scegliere l'attrezzatura perfetta per le tue esigenze.</p>
          <a 
            href="https://wa.me/393477397016" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-all"
          >
            Contattaci su WhatsApp
          </a>
        </motion.div>

      </div>
    </div>
  );
}
