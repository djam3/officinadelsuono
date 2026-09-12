import { ShieldCheck, MessageCircle, Award, MapPin } from 'lucide-react';
import { BUSINESS, waLink } from '../config/site';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-black border-t border-white/10">
      {/* Trust Signals Bar */}
      <div className="border-b border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: BUSINESS.area, desc: "Consegna su preventivo" },
              { icon: ShieldCheck, title: "Attrezzatura professionale", desc: "Controllata prima di ogni consegna" },
              { icon: Award, title: "Esperto Certificato", desc: "MAT Academy" },
              { icon: MessageCircle, title: "Supporto WhatsApp", desc: "Rispondiamo in 15 min" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-16 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="w-8 h-8" />
              <span className="text-2xl font-black tracking-tighter uppercase">
                Officina<span className="text-brand-orange">delsuono</span>
              </span>
            </div>
            <p className="text-zinc-400 max-w-sm mb-6">
              {BUSINESS.description}
            </p>
            <a
              href={waLink('Ciao! Ti scrivo dal sito Officinadelsuono.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-orange hover:text-white transition-colors font-bold"
            >
              <MessageCircle className="w-4 h-4" /> WA: {BUSINESS.whatsappDisplay}
            </a>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Risorse</h3>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={() => onNavigate?.('about')} className="hover:text-brand-orange transition-colors">Chi Siamo</button></li>
              <li><button onClick={() => onNavigate?.('contact')} className="hover:text-brand-orange transition-colors">Contatti</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Supporto</h3>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <a href={waLink('Ciao! Ti scrivo dal sito Officinadelsuono.')} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-white transition-colors block">WA: {BUSINESS.whatsappDisplay}</a>
                <a href={`mailto:${BUSINESS.email}`} className="text-brand-orange hover:text-white transition-colors block mt-1">{BUSINESS.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8">
          <div className="text-[10px] text-zinc-600 space-y-1 text-center lg:text-left uppercase tracking-tighter">
            <p>&copy; {new Date().getFullYear()} Officinadelsuono di Amerigo De Cristofaro - Ditta Individuale - Sede a Forino (AV).</p>
            <p>P.IVA: 03243690645 | PEC: amerigodecristofaro@pec.it | REA: AV - 314125</p>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-end items-center gap-x-6 gap-y-3 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
            <button onClick={() => onNavigate?.('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigate?.('terms')} className="hover:text-white transition-colors">Termini e Condizioni</button>
            <button onClick={() => onNavigate?.('cookie-policy')} className="hover:text-white transition-colors">Cookie Policy</button>
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-center">Risoluzione Controversie (ODR)</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
