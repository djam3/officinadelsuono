/**
 * Tavola di confronto delle palette.
 *
 * Tre varianti affiancate, ciascuna applicata a una fetta vera di interfaccia —
 * un titolo, una riga di risultati, un campo, un avviso, un pulsante, una curva
 * — perché una palette non si giudica sui quadratini di colore ma su come si
 * comporta sugli elementi che poi si useranno davvero.
 *
 * Ogni variante ha un pulsante che la applica a TUTTO il sito: la scelta resta
 * memorizzata, si naviga nelle pagine vere e si decide su quelle.
 */

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { Annot, Griglia } from '../components/blueprint';
import { PALETTE, PALETTE_DEFAULT, applicaPalette, paletteSalvata, type Palette } from '../data/palette';

export function Palette({ onNavigate }: { onNavigate?: (page: string) => void }) {
  useSEO({
    title: 'Confronto delle palette',
    description: 'Tre varianti di colore applicate a una fetta reale di interfaccia, per sceglierle guardandole accanto.',
    url: '/palette',
  });

  const [attiva, setAttiva] = useState(PALETTE_DEFAULT);
  useEffect(() => { setAttiva(paletteSalvata()); }, []);

  const scegli = (id: string) => {
    applicaPalette(id);
    setAttiva(id);
  };

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 99</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Confronto</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-4">
            Tre <span className="text-marker">registri</span>
          </h1>
          <p className="text-graphite max-w-3xl leading-relaxed">
            Non tre gradazioni della stessa idea: tre modi diversi di dire cosa sia questo strumento. Ogni
            variante è applicata a una fetta vera di interfaccia, perché una palette non si giudica sui
            quadratini ma su come si comporta sugli elementi che poi si usano.
          </p>
          <p className="text-graphite max-w-3xl leading-relaxed mt-4">
            Il vincolo che vale per tutte e tre: nell&rsquo;interfaccia il caldo è <strong className="text-paper">uno solo</strong> ed
            è quello degli avvisi. Dove l&rsquo;accento è freddo l&rsquo;avviso è ambra; dove l&rsquo;accento è caldo
            l&rsquo;avviso si sposta sul giallo. Due caldi vicini si contendono lo sguardo, e a perdere è sempre
            l&rsquo;avviso — l&rsquo;unica cosa che deve farsi notare.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {PALETTE.map(p => (
            <Variante key={p.id} p={p} attiva={attiva === p.id} onScegli={() => scegli(p.id)} />
          ))}
        </div>

        <div className="mt-10 bg-ink-2/70 border border-paper/10 p-6">
          <p className="annot annot-blue block mb-3">Come leggere questa pagina</p>
          <ul className="space-y-2 text-sm text-paper/90 leading-relaxed">
            <li>— Il pulsante <strong>Applica al sito</strong> cambia i colori di tutte le pagine e ricorda la scelta. Naviga nel calcolatore e nel glossario con quella addosso: è lì che si decide.</li>
            <li>— I riquadri qui sopra mostrano i colori nel loro contesto, ma restano dentro la palette attiva del sito per i bordi e i fondi: il confronto vero si fa applicandole.</li>
            <li>— Restano fuori i pochi colori scritti a mano dentro i grafici SVG. Quando avrai scelto li allineo nel codice, insieme al favicon e all&rsquo;immagine di anteprima.</li>
          </ul>
          {onNavigate && (
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => onNavigate('cabinet-designer')} className="btn-tratto">Prova sul calcolatore</button>
              <button onClick={() => onNavigate('home')} className="btn-tratto">Prova sulla home</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Variante({ p, attiva, onScegli }: { p: Palette; attiva: boolean; onScegli: () => void }) {
  const t = p.token;
  return (
    <div className={`tavola p-0 overflow-hidden ${attiva ? 'ring-1 ring-marker' : ''}`}>
      {/* intestazione */}
      <div className="p-5 border-b border-paper/10">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h2 className="titolo text-2xl">{p.nome}</h2>
          {attiva && (
            <span className="annot annot-marker flex items-center gap-1">
              <Check className="w-3 h-3" /> attiva
            </span>
          )}
        </div>
        <p className="annot annot-blue">{p.registro}</p>
        <p className="text-[13px] text-graphite leading-relaxed mt-3">{p.descrizione}</p>
      </div>

      {/* anteprima: una fetta di interfaccia vera, coi colori della variante */}
      <div style={{ background: t.ink }} className="p-5">
        <div className="flex items-baseline gap-2 mb-4">
          <span style={{ color: t.blueprint }} className="font-mono text-[9px] uppercase tracking-[0.18em]">Tav. 04</span>
          <span style={{ background: t.blueprint, opacity: 0.45 }} className="h-px flex-1" />
          <span style={{ color: t.graphite }} className="font-mono text-[9px] uppercase tracking-[0.18em]">Scala 1:1</span>
        </div>

        <h3 className="titolo text-2xl mb-1" style={{ color: t.paper }}>
          Si progetta <span style={{ color: t.marker }}>prima</span>
        </h3>
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: t.graphite }}>
          Testo secondario come quello che accompagna i campi e le schede.
        </p>

        {/* riga di risultati */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['Vb', '43,1 L'], ['Fb', '31,4 Hz'], ['F3', '43,2 Hz']].map(([k, v]) => (
            <div key={k} style={{ background: t.ink2, border: `1px solid ${t.paper}1A` }} className="px-2 py-2">
              <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: t.graphiteDim }}>{k}</div>
              <div className="font-mono text-sm" style={{ color: t.marker }}>{v}</div>
            </div>
          ))}
        </div>

        {/* campo */}
        <div style={{ background: t.ink2, border: `1px solid ${t.paper}1A` }} className="px-3 py-2 mb-3">
          <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: t.graphite }}>Volume netto</div>
          <div className="font-mono text-base" style={{ color: t.paper }}>43,1</div>
        </div>

        {/* avviso: è qui che si vede se il caldo funziona */}
        <div style={{ background: `${t.segnale}0D`, border: `1px solid ${t.segnale}40` }} className="px-3 py-2 mb-4">
          <p className="text-[11px] leading-relaxed" style={{ color: t.segnale }}>
            ▲ Il condotto misura 381 mm ma in profondità ne restano 141: passa a un ripiegato a L.
          </p>
        </div>

        {/* una curva, perché i grafici sono metà di questo sito */}
        <svg viewBox="0 0 260 78" className="w-full h-auto mb-4">
          <line x1="8" y1="70" x2="252" y2="70" stroke={t.paper} strokeOpacity="0.2" strokeWidth="1" />
          <line x1="8" y1="8" x2="8" y2="70" stroke={t.paper} strokeOpacity="0.2" strokeWidth="1" />
          <line x1="8" y1="30" x2="252" y2="30" stroke={t.blueprint} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 4" />
          <path d="M14 66 C34 62 46 40 60 22 C76 8 110 12 140 13 C180 14 220 14 250 15"
            fill="none" stroke={t.marker} strokeWidth="2" strokeLinecap="round" />
          <path d="M14 70 C40 66 58 52 78 44 C110 32 170 26 250 24"
            fill="none" stroke={t.blueprint} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 20 L250 20" stroke={t.segnale} strokeWidth="1.2" strokeDasharray="5 3" />
        </svg>

        {/* pulsanti */}
        <div className="flex gap-2">
          <span style={{ background: t.marker, color: t.ink }}
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2">
            Calcola
          </span>
          <span style={{ border: `1px solid ${t.paper}38`, color: t.paper }}
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2">
            Glossario
          </span>
        </div>
      </div>

      {/* pro e contro: la parte che serve davvero a decidere */}
      <div className="p-5 border-t border-paper/10 space-y-3">
        <p className="text-[12px] leading-relaxed text-paper/90">
          <span className="text-marker font-black">+</span> {p.pro}
        </p>
        <p className="text-[12px] leading-relaxed text-graphite">
          <span className="text-graphite-dim font-black">−</span> {p.contro}
        </p>
        <div className="flex gap-1.5 pt-2">
          {[t.ink, t.ink2, t.paper, t.graphite, t.blueprint, t.marker, t.segnale, t.mdf].map((c, i) => (
            <span key={i} style={{ background: c }} className="h-6 flex-1 border border-paper/10" title={c} />
          ))}
        </div>
        <button
          onClick={onScegli}
          className={attiva ? 'btn-tratto w-full justify-center' : 'btn-marker w-full justify-center'}
          disabled={attiva}
        >
          {attiva ? 'Attiva sul sito' : 'Applica al sito'}
        </button>
      </div>
    </div>
  );
}
