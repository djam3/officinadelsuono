import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { Award, Star, Music, ShieldCheck } from 'lucide-react';

export function AboutUs() {
  useSEO({
    title: 'Chi Siamo — Amerigo De Cristofaro & Officina del Suono',
    description: 'Scopri chi è Amerigo De Cristofaro: sound engineer certificato MAT Academy, esperto di attrezzatura audio professionale. La storia di Officina del Suono.',
    url: '/chi-siamo',
  });

  return (
    <div className="min-h-screen bg-ink text-white pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section / Storytelling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-marker/10 text-marker border border-marker/20 mb-6">
              <Music className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">La Nostra Storia</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">
              Il suono giusto per <span className="text-marker">ogni progetto</span>.
            </h1>

            <div className="space-y-6 text-lg text-graphite leading-relaxed">
              <p>
                Officina del Suono nasce da una convinzione semplice: la differenza tra un evento riuscito e uno mediocre è quasi sempre nella scelta dell'attrezzatura audio giusta. <strong>Amerigo De Cristofaro</strong>, sound engineer certificato MAT Academy, mette a disposizione competenza tecnica reale, testata sul campo.
              </p>
              <p className="text-white font-medium border-l-2 border-marker pl-6 italic">
                "Ho visto troppi progetti rovinati da un setup sottodimensionato o collegato male. Io ti do consulenza professionale, verificata pezzo per pezzo."
              </p>
              <p>
                Con sede a <strong>Forino (AV)</strong>, seguiamo ogni richiesta di persona: verifica tecnica, spiegazione chiara e assistenza diretta su WhatsApp. Prezzi chiari, senza sorprese.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-marker/10 blur-3xl rounded-full"></div>
            <div className="relative rounded-none overflow-hidden border border-paper/10 shadow-2xl aspect-[4/5]">
              <img
                src="/amerigo_hero.png"
                alt="Amerigo De Cristofaro al mixer"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent">
                <p className="text-white font-bold text-xl">Amerigo De Cristofaro</p>
                <p className="text-graphite text-sm">Founder & DJ Certificato MAT Academy</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Proof of Concept / Certificate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 bg-ink-2/30 rounded-none p-8 md:p-16 border border-paper/[0.06]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-ink-2 text-graphite border border-paper/10 mb-6">
              <ShieldCheck className="w-4 h-4 text-[#35CFC0]" />
              <span className="text-xs font-bold uppercase tracking-wider">Proof of Concept</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
              La formazione è la tua <span className="text-marker">Garanzia</span>.
            </h2>
            <p className="text-lg text-graphite leading-relaxed mb-8">
              Non ci improvvisiamo esperti. La certificazione <strong>MAT Academy</strong> è il "bollino di qualità" che assicura che ogni consiglio tecnico, ogni cablaggio e ogni configurazione software sia eseguita secondo i più alti standard dell'industria Pro-Audio.
            </p>
            <div className="flex items-center gap-4 text-paper/90">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-ink bg-ink-3 flex items-center justify-center">
                    <Star className="w-4 h-4 text-marker fill-current" />
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
            className="order-1 lg:order-2 relative p-[2px] rounded-none bg-paper/15  group transition-all duration-500"
          >
            <div className="bg-ink p-8 md:p-12 rounded-none border border-paper/10 relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,125,38,0.05),transparent_70%)]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-marker/50"></div>
              <Award className="absolute -right-12 -bottom-12 w-64 h-64 text-white/[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />

              {/* Certificate Content */}
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center gap-3 mb-6">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-8 bg-[#35CFC0] transform -skew-x-12"></div>
                      <div className="w-2 h-10 bg-[#35CFC0] transform -skew-x-12 -translate-y-1"></div>
                      <div className="w-2 h-8 bg-marker transform -skew-x-12"></div>
                    </div>
                    <span className="text-2xl font-black tracking-[0.2em] text-white">MAT ACADEMY</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="h-[1px] w-8 bg-ink-3"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-graphite">Attestato di Partecipazione</h3>
                    <div className="h-[1px] w-8 bg-ink-3"></div>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <p className="text-[11px] text-graphite uppercase tracking-[0.2em] mb-6 italic">Si attesta che lo studente</p>
                  <p className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-8">
                    Amerigo <span className="text-marker italic">De Cristofaro</span>
                  </p>
                  <p className="text-[11px] text-graphite uppercase tracking-[0.2em] mb-4">Ha completato con successo il master</p>
                  <div className="inline-block px-6 py-2 rounded-full bg-marker/5 border border-marker/20">
                    <p className="text-xl md:text-2xl font-mono font-bold text-marker tracking-tighter">Pro DJ Academy [Full Course]</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-paper/[0.06]">
                  <div className="text-left">
                    <p className="text-[9px] text-graphite uppercase tracking-widest mb-2">Data di Rilascio</p>
                    <p className="text-lg font-bold text-white">28 Febbraio 2025</p>
                    <p className="text-[9px] font-mono text-graphite-dim mt-1">VERIFIED ID: 176913-176522</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-end">
                    <div className="mb-2">
                      <p className="font-serif text-xl text-white italic leading-none">Alex Tripi & Nello Greco</p>
                      <div className="h-[1px] w-32 bg-marker/50 mt-2"></div>
                    </div>
                    <p className="text-[9px] text-graphite uppercase tracking-widest">Fondatori MAT Academy</p>
                  </div>
                </div>

                {/* Seal */}
                <div className="absolute top-0 right-0 opacity-20 group-hover:opacity-40 transition-opacity">
                  <ShieldCheck className="w-12 h-12 text-marker" />
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
          className="p-12 rounded-none bg-ink-2/70 border border-marker/20 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Pronto per il tuo prossimo Setup?</h3>
          <p className="text-graphite mb-8 max-w-xl mx-auto">Offriamo consulenza tecnica personalizzata per aiutarti a scegliere l'attrezzatura perfetta per le tue esigenze.</p>
          <a 
            href="https://wa.me/393477397016" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-marker text-ink rounded-none font-bold hover:bg-marker/85 transition-all"
          >
            Contattaci su WhatsApp
          </a>
        </motion.div>

      </div>
    </div>
  );
}
