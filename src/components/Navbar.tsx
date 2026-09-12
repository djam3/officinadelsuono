/**
 * Barra di navigazione in chiave "bordo tavola".
 *
 * Le voci sono numerate come i fogli di un fascicolo di disegni, e quella
 * attiva porta il segno del pennarello. Su mobile il menu si apre a pagina
 * intera come un indice delle tavole, invece di far scorrere la pagina sotto
 * un elenco schiacciato.
 */

import { useEffect, useState } from 'react';
import { X, Menu as MenuIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';

interface NavbarProps {
  onNavigate: (page: string, param?: string) => void;
  current?: string;
}

const VOCI: { page: string; label: string; nota: string }[] = [
  { page: 'cabinet-designer', label: 'Progetta', nota: 'Calcolatore casse' },
  { page: 'glossary', label: 'Glossario', nota: 'I parametri spiegati' },
  { page: 'about', label: 'Officina', nota: 'Chi c’è dietro' },
  { page: 'contact', label: 'Contatti', nota: 'Parliamone' },
];

export function Navbar({ onNavigate, current }: NavbarProps) {
  const [aperto, setAperto] = useState(false);

  // il menu a pagina intera blocca lo scorrimento sotto
  useEffect(() => {
    document.body.style.overflow = aperto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [aperto]);

  // chiusura con Esc: un menu che copre tutto deve avere una via d'uscita
  useEffect(() => {
    if (!aperto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAperto(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aperto]);

  const vai = (page: string) => { onNavigate(page); setAperto(false); };

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-ink/95 backdrop-blur-sm border-b border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <button
              onClick={() => vai('home')}
              className="flex items-center gap-3 min-w-0 group"
              aria-label="Officina del Suono, torna alla pagina iniziale"
            >
              <Logo className="w-9 h-9 shrink-0" />
              <span className="hidden sm:flex flex-col items-start leading-none">
                <span className="titolo text-lg text-paper">
                  Officina<span className="text-marker">delsuono</span>
                </span>
                <span className="annot mt-1">Progettazione acustica</span>
              </span>
            </button>

            <div className="hidden md:flex items-stretch h-full">
              {VOCI.map((v, i) => {
                const attiva = current === v.page;
                return (
                  <button
                    key={v.page}
                    onClick={() => vai(v.page)}
                    aria-current={attiva ? 'page' : undefined}
                    className={`relative px-5 flex flex-col justify-center items-start border-l border-paper/10 last:border-r transition-colors ${
                      attiva ? 'text-paper bg-paper/[0.04]' : 'text-graphite hover:text-paper'
                    }`}
                  >
                    <span className="annot annot-blue mb-1">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display font-extrabold uppercase tracking-tight text-sm">
                      {v.label}
                    </span>
                    {attiva && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-marker" />}
                  </button>
                );
              })}
            </div>

            <button
              className="md:hidden p-2 text-paper"
              onClick={() => setAperto(true)}
              aria-label="Apri il menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {aperto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[110] bg-ink md:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menu di navigazione"
          >
            <div className="absolute inset-0 blueprint-grid pointer-events-none" aria-hidden />

            <div className="relative flex items-center justify-between h-[72px] px-4 border-b border-paper/10">
              <span className="annot">Indice delle tavole</span>
              <button onClick={() => setAperto(false)} className="p-2 text-paper" aria-label="Chiudi il menu">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative px-4 py-6">
              {VOCI.map((v, i) => (
                <motion.button
                  key={v.page}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.22 }}
                  onClick={() => vai(v.page)}
                  className="w-full text-left py-5 border-b border-paper/10 flex items-baseline gap-4 group"
                >
                  <span className="annot annot-blue shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span
                      className={`block titolo text-3xl ${
                        current === v.page ? 'text-marker' : 'text-paper group-hover:text-marker'
                      } transition-colors`}
                    >
                      {v.label}
                    </span>
                    <span className="annot block mt-1.5">{v.nota}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
