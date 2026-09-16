/**
 * Piede di pagina in forma di cartiglio.
 *
 * In una tavola tecnica il cartiglio sta in basso e porta chi ha disegnato,
 * cosa, in che scala e su quale foglio. Qui fa lo stesso lavoro: identifica il
 * sito, elenca le sezioni e chiude con i riferimenti. Il contenuto precedente
 * veniva da un progetto diverso ed è stato riscritto.
 */

import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { BUSINESS, waLink } from '../config/site';
import { Logo } from './Logo';
import { Righello } from './blueprint';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const SEZIONI: { page: string; label: string }[] = [
  { page: 'cabinet-designer', label: 'Calcolatore casse' },
  { page: 'glossary', label: 'Glossario dei parametri' },
  { page: 'about', label: 'Chi c’è dietro' },
  { page: 'contact', label: 'Contatti' },
];

const LEGALE: { page: string; label: string }[] = [
  { page: 'terms', label: 'Termini' },
  { page: 'privacy', label: 'Privacy' },
  { page: 'cookie-policy', label: 'Cookie' },
];

export function Footer({ onNavigate }: FooterProps) {
  const go = (page: string) => onNavigate?.(page);

  return (
    <footer className="relative bg-ink border-t border-paper/15">
      <Righello fitto />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          {/* identificazione */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Logo className="w-9 h-9 shrink-0" />
              <span className="flex flex-col leading-none">
                <span className="titolo text-lg text-paper">
                  Officina<span className="text-marker">delsuono</span>
                </span>
                <span className="annot mt-1">Progettazione acustica</span>
              </span>
            </div>
            <p className="text-sm text-graphite leading-relaxed max-w-sm">
              Strumenti di progettazione per casse acustiche, con i conti in chiaro e le fonti citate.
              Calcolatore per casse acustiche. Gratuito, senza registrazione, senza pubblicità.
            </p>
          </div>

          {/* sezioni */}
          <nav aria-label="Sezioni del sito">
            <span className="annot annot-blue block mb-4">Tavole</span>
            <ul className="space-y-2.5">
              {SEZIONI.map(s => (
                <li key={s.page}>
                  <button
                    onClick={() => go(s.page)}
                    className="text-sm text-graphite hover:text-marker transition-colors text-left"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* contatti */}
          <div>
            <span className="annot annot-blue block mb-4">Riferimenti</span>
            <ul className="space-y-3">
              <li>
                <a
                  href={waLink('Ciao! Ti scrivo dal sito.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-graphite hover:text-marker transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                  {BUSINESS.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="flex items-start gap-2.5 text-sm text-graphite hover:text-marker transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-graphite">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                {BUSINESS.area}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* riga del cartiglio */}
      <div className="border-t border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-paper/10 border-x border-paper/10">
            <div className="px-4 py-3">
              <span className="annot block mb-1">Progetto</span>
              <span className="font-mono text-xs text-paper">{BUSINESS.name}</span>
            </div>
            <div className="px-4 py-3">
              <span className="annot block mb-1">Motore</span>
              <span className="font-mono text-xs text-paper">Thiele/Small</span>
            </div>
            <div className="px-4 py-3">
              <span className="annot block mb-1">Revisione</span>
              <span className="font-mono text-xs text-paper">{new Date().getFullYear()}</span>
            </div>
            <div className="px-4 py-3">
              <span className="annot block mb-1">Legale</span>
              <span className="flex flex-wrap gap-x-2 gap-y-1">
                {LEGALE.map(l => (
                  <button
                    key={l.page}
                    onClick={() => go(l.page)}
                    className="font-mono text-xs text-graphite hover:text-marker transition-colors"
                  >
                    {l.label}
                  </button>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <p className="annot">
          © {new Date().getFullYear()} {BUSINESS.name} — I calcoli sono modelli lineari a piccoli segnali:
          verifica sempre le misure prima di tagliare.
        </p>
      </div>
    </footer>
  );
}
