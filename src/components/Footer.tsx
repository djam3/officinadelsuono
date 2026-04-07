import { Truck, ShieldCheck, MessageCircle, Award } from 'lucide-react';
import { PaymentLogos } from './PaymentLogos';
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
              { icon: Truck, title: "Spedizione Gratuita", desc: "Ordini sopra 99\u20AC" },
              { icon: ShieldCheck, title: "Garanzia 2 Anni", desc: "Su tutti i prodotti" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="w-8 h-8" />
              <span className="text-2xl font-black tracking-tighter uppercase">
                Officina<span className="text-brand-orange">delsuono</span>
              </span>
            </div>
            <p className="text-zinc-400 max-w-sm mb-6">
              Consulenza tecnica specializzata per DJ (Certificazione MAT Academy) e vendita hardware professionale. Il tuo suono, configurato da esperti.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={() => onNavigate?.('shop')} className="hover:text-brand-orange transition-colors">Tutti i Prodotti</button></li>
              <li><button onClick={() => onNavigate?.('shop')} className="hover:text-brand-orange transition-colors font-bold text-brand-orange/80">Setup Curati by Amerigo</button></li>
              <li><button onClick={() => onNavigate?.('shop')} className="hover:text-brand-orange transition-colors">Controller DJ</button></li>
              <li><button onClick={() => onNavigate?.('shop')} className="hover:text-brand-orange transition-colors">Mixer & Effetti</button></li>
              <li><button onClick={() => onNavigate?.('shop')} className="hover:text-brand-orange transition-colors">Casse Attive (PA)</button></li>
              <li><button onClick={() => onNavigate?.('shop')} className="hover:text-brand-orange transition-colors">Cuffie Pro</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Risorse</h3>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={() => onNavigate?.('blog')} className="hover:text-brand-orange transition-colors">Blog</button></li>
              <li><button onClick={() => onNavigate?.('about')} className="hover:text-brand-orange transition-colors">Chi Siamo</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Supporto</h3>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={() => onNavigate?.('contact')} className="hover:text-brand-orange transition-colors">Contatti</button></li>
              <li><button onClick={() => onNavigate?.('terms')} className="hover:text-brand-orange transition-colors">Spedizioni e Resi</button></li>
              <li><button onClick={() => onNavigate?.('terms')} className="hover:text-brand-orange transition-colors">Garanzia</button></li>
              <li className="pt-2">
                <a href="https://wa.me/393477397016?text=Ciao%20Amerigo!%20%F0%9F%91%8B%20Ti%20scrivo%20dal%20sito%20Officinadelsuono." target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-white transition-colors block">WA: +39 347 739 7016</a>
                <a href="mailto:info@officina-del-suono.it" className="text-brand-orange hover:text-white transition-colors block mt-1">info@officina-del-suono.it</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8">
          <div className="flex flex-col gap-6 items-center lg:items-start w-full lg:w-auto">
            <div className="flex flex-col items-center lg:items-start gap-3 w-full">
              <PaymentLogos />
            </div>
            <div className="text-[10px] text-zinc-600 space-y-1 text-center lg:text-left uppercase tracking-tighter">
              <p>&copy; {new Date().getFullYear()} Officinadelsuono di Amerigo De Cristofaro - Ditta Individuale - Sede a Forino (AV).</p>
              <p>P.IVA: 03243690645 | PEC: amerigodecristofaro@pec.it | REA: AV - 314125</p>
            </div>
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
