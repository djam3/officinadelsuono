import { Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[100] bg-zinc-950/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={() => onNavigate('home')}>
            <Logo className="w-10 h-10 group-hover:scale-110 transition-transform duration-300 shrink-0" />
            <span className="hidden sm:inline text-2xl font-black tracking-tighter uppercase">
              Officina<span className="text-brand-orange">delsuono</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <button onClick={() => onNavigate('cabinet-designer')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Calcolatore Casse</button>
            <button onClick={() => onNavigate('about')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all">Chi Siamo</button>
            <button onClick={() => onNavigate('contact')} className="px-5 py-2 text-sm font-bold uppercase tracking-wider text-white bg-brand-orange hover:bg-brand-orange/90 rounded-full transition-all shadow-[0_0_15px_rgba(242,125,38,0.5)]">Contatti</button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <button className="md:hidden p-2 hover:text-brand-orange transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-950 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <button onClick={() => { onNavigate('cabinet-designer'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Calcolatore Casse</button>
              <button onClick={() => { onNavigate('about'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Chi Siamo</button>
              <button onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-4 text-lg font-bold text-zinc-300 hover:text-brand-orange hover:bg-white/5 uppercase tracking-wider transition-colors border-b border-white/5">Contatti</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
