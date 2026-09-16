/**
 * Glossario tecnico: indice delle voci e pagina della singola voce.
 *
 * Una sola pagina serve entrambi i casi, perché la differenza è solo se lo
 * slug c'è o no. Le schede sono raggiunte dalla ⓘ accanto a ogni campo del
 * calcolatore, che le apre in una scheda nuova per non perdere il progetto in
 * corso.
 */

import { useMemo, useState, type MouseEvent } from 'react';
import { ArrowLeft, BookOpen, Info, Link2, AlertTriangle, Search, X } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import {
  CATEGORY_INTRO, CATEGORY_LABELS, GLOSSARY, GLOSSARY_BY_ID, cercaGlossario, glossaryUrl,
  type GlossaryBlock, type GlossaryCategory, type GlossaryEntry,
} from '../data/glossary';
import { Annot, Griglia, Righello } from '../components/blueprint';

const ORDER: GlossaryCategory[] = ['driver', 'cassa', 'condotto', 'reti', 'impianto', 'materiali', 'costruzione'];

export type Naviga = (page: string, param?: string) => void;

/**
 * Intercetta il clic per navigare senza ricaricare tutta l'applicazione, ma
 * lascia intatto l'href: cosi il collegamento resta un collegamento vero —
 * apribile in una scheda nuova, copiabile, visibile ai motori di ricerca.
 */
function interno(naviga: Naviga | undefined, page: string, param?: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (!naviga) return;
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    naviga(page, param);
  };
}

function Blocks({ blocks }: { blocks: GlossaryBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <section key={i} className="mb-8">
          {b.heading && (
            <h2 className="titolo text-lg text-paper mb-3">{b.heading}</h2>
          )}
          {b.paragraphs?.map((p, j) => (
            <p key={j} className="text-paper/90 leading-relaxed mb-3">{p}</p>
          ))}
          {b.formula && (
            <div className="my-4 bg-ink-2/80 border border-paper/10 rounded-none px-5 py-4">
              <code className="block text-marker font-mono text-sm sm:text-base">{b.formula.expr}</code>
              {b.formula.caption && (
                <span className="block text-[11px] text-graphite mt-2 leading-relaxed">{b.formula.caption}</span>
              )}
            </div>
          )}
          {b.list && (
            <ul className="space-y-2 mt-3">
              {b.list.map((li, j) => (
                <li key={j} className="text-paper/90 leading-relaxed flex gap-3">
                  <span className="text-marker shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-marker" />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          )}
          {b.callout && (
            <div
              className={`mt-4 rounded-none px-4 py-3 flex gap-3 border ${
                b.callout.kind === 'attenzione'
                  ? 'bg-amber-500/5 border-amber-500/25'
                  : 'bg-paper/[0.03] border-paper/10'
              }`}
            >
              {b.callout.kind === 'attenzione'
                ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                : <Info className="w-4 h-4 text-graphite shrink-0 mt-0.5" />}
              <p className="text-sm text-paper/90 leading-relaxed">{b.callout.text}</p>
            </div>
          )}
        </section>
      ))}
    </>
  );
}

function Voce({ entry, naviga }: { entry: GlossaryEntry; naviga?: Naviga }) {
  useSEO({
    title: `${entry.symbol} — ${entry.title}`,
    description: entry.summary,
    url: glossaryUrl(entry.id),
  });

  const related = (entry.related ?? []).map(id => GLOSSARY_BY_ID[id]).filter(Boolean);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <a
        href="/glossario"
        onClick={interno(naviga, 'glossary')}
        className="inline-flex items-center gap-2 text-xs text-graphite hover:text-marker transition-colors mb-8 uppercase tracking-[0.2em] font-black"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Glossario
      </a>

      <div className="mb-8">
        <span className="annot annot-marker">
          {CATEGORY_LABELS[entry.category]}
        </span>
        <h1 className="titolo text-5xl md:text-6xl mt-3 mb-2">
          <span className="text-marker">{entry.symbol}</span>
          {entry.unit && <span className="text-graphite-dim text-2xl md:text-3xl ml-3">{entry.unit}</span>}
        </h1>
        <p className="text-xl text-graphite font-medium">{entry.title}</p>
        <p className="text-graphite mt-4 leading-relaxed">{entry.summary}</p>
      </div>

      {entry.typical && (
        <div className="mb-10 bg-ink-2/70 border border-paper/10 rounded-none p-5">
          <h2 className="annot annot-blue block mb-4">
            Valori tipici
          </h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {entry.typical.map(t => (
              <div key={t.label} className="flex items-baseline justify-between gap-3 border-b border-paper/[0.06] pb-2">
                <dt className="text-sm text-graphite">{t.label}</dt>
                <dd className="text-sm font-mono text-white shrink-0">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <Blocks blocks={entry.blocks} />

      {entry.sources && (
        <div className="mt-12 pt-6 border-t border-paper/10">
          <h2 className="annot annot-blue block mb-3">
            Da dove vengono questi numeri
          </h2>
          <ul className="space-y-1.5">
            {entry.sources.map((s, i) => (
              <li key={i} className="text-[12px] text-graphite leading-relaxed">— {s}</li>
            ))}
          </ul>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-10 pt-6 border-t border-paper/10">
          <h2 className="annot annot-blue block mb-4">
            Parametri collegati
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map(r => (
              <a
                key={r.id}
                href={glossaryUrl(r.id)}
                onClick={interno(naviga, 'glossary', r.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-none bg-paper/[0.03] border border-paper/10 hover:border-marker/50 transition-colors"
              >
                <Link2 className="w-3 h-3 text-marker" />
                <span className="text-sm text-paper/90">{r.symbol}</span>
                <span className="text-[11px] text-graphite-dim hidden sm:inline">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <a
          href="/progetta-cassa"
          onClick={interno(naviga, 'cabinet-designer')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-none bg-marker text-black font-black uppercase tracking-wider text-xs hover:bg-marker/90 transition-colors"
        >
          Torna al calcolatore
        </a>
      </div>
    </article>
  );
}

/** La tessera di una voce nell'indice. Era scritta una volta sola dentro
 *  l'elenco per categoria; adesso la usa anche la ricerca. */
function Scheda({ e, naviga }: { e: GlossaryEntry; naviga?: Naviga }) {
  return (
    <a
      href={glossaryUrl(e.id)}
      onClick={interno(naviga, 'glossary', e.id)}
      className="tavola tavola-hover block p-4 group"
    >
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-marker font-black">{e.symbol}</span>
        {e.unit && <span className="text-[11px] text-graphite-dim">{e.unit}</span>}
      </div>
      <p className="text-sm text-paper/90 font-medium mb-1.5 group-hover:text-white transition-colors">
        {e.title}
      </p>
      <p className="text-[11px] text-graphite leading-relaxed">{e.summary}</p>
    </a>
  );
}

function Indice({ naviga }: { naviga?: Naviga }) {
  useSEO({
    title: 'Glossario dei parametri Thiele-Small e di progettazione casse',
    description: 'Una scheda per ogni parametro del calcolatore: che cos’è, a cosa serve nel progetto, quali valori aspettarsi e dove si sbaglia.',
    url: '/glossario',
  });

  const [cerca, setCerca] = useState('');

  // cinquantanove schede sono troppe per scorrerle, e chi arriva qui cerca
  // quasi sempre una cosa sola. Il come sta in cercaGlossario.
  const trovate = useMemo(() => (cerca.trim() ? cercaGlossario(cerca) : null), [cerca]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <div className="flex items-baseline gap-3 mb-6">
          <Annot tone="blueprint">Tav. 20</Annot>
          <div className="quota flex-1 max-w-[200px]" aria-hidden />
          <Annot>Indice dei termini</Annot>
        </div>
        <h1 className="titolo text-4xl md:text-6xl mb-4">
          I parametri, <span className="text-marker">spiegati</span>
        </h1>
        <p className="text-graphite max-w-3xl leading-relaxed">
          Una scheda per ogni campo del calcolatore. Ognuna risponde alle stesse quattro domande: che cos&rsquo;è,
          a cosa serve nel progetto, quali valori aspettarsi e dove si sbaglia di solito. I numeri citati vengono
          dalla letteratura tecnica pubblicata o da verifiche fatte sul motore di calcolo, e ogni scheda dice
          quali. Dove un conto è stato ricavato invece che copiato, la scheda riporta anche il controllo che lo
          conferma: il valore atteso, quello ottenuto e lo scarto.
        </p>
        <div className="relative max-w-xl mt-8">
          <Search className="w-4 h-4 text-graphite absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="cerca-glossario"
            type="search"
            value={cerca}
            onChange={e => setCerca(e.target.value)}
            placeholder="Cerca un parametro, un&rsquo;unità, un valore…"
            className="w-full bg-ink-2 border border-paper/10 rounded-none pl-10 pr-10 py-3 text-paper placeholder:text-graphite-dim focus:border-marker/50 outline-none"
          />
          {cerca && (
            <button
              type="button"
              onClick={() => setCerca('')}
              aria-label="Cancella la ricerca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite hover:text-marker transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {trovate && (
          <p className="annot mt-3" aria-live="polite">
            {trovate.length === 0
              ? 'Nessuna scheda con questa parola'
              : `${trovate.length} ${trovate.length === 1 ? 'scheda' : 'schede'}`}
          </p>
        )}
      </div>

      {/* con una ricerca in corso si mostrano i risultati, non le categorie:
          raggrupparli per categoria quando sono tre renderebbe solo piu'
          lungo arrivarci */}
      {trovate && (
        <section className="mb-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trovate.map(e => <Scheda key={e.id} e={e} naviga={naviga} />)}
          </div>
          {trovate.length === 0 && (
            <p className="text-graphite leading-relaxed max-w-2xl">
              Prova con il simbolo (Qts, Fb, Vas), con l&rsquo;unità di misura, o con quello che vuoi
              ottenere — «condotto», «assorbente», «cavo».
            </p>
          )}
        </section>
      )}

      {!trovate && ORDER.map(cat => {
        const voci = GLOSSARY.filter(e => e.category === cat);
        if (!voci.length) return null;
        return (
          <section key={cat} className="mb-14">
            <h2 className="titolo text-2xl mb-2">{CATEGORY_LABELS[cat]}</h2>
            <p className="text-sm text-graphite mb-6 max-w-3xl leading-relaxed">{CATEGORY_INTRO[cat]}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {voci.map(e => <Scheda key={e.id} e={e} naviga={naviga} />)}
            </div>
          </section>
        );
      })}

      <Righello fitto className="mt-4" />
      <div className="pt-8">
        <h2 className="annot annot-blue block mb-3">Riferimenti principali</h2>
        <ul className="space-y-1.5 text-[12px] text-graphite leading-relaxed max-w-3xl">
          <li>— A. N. Thiele, «Loudspeakers in Vented Boxes», JAES 1971</li>
          <li>— R. H. Small, «Direct-Radiator Loudspeaker System Analysis», JAES 1972</li>
          <li>— R. H. Small, «Closed-Box Loudspeaker Systems», JAES 1972–73</li>
          <li>— R. H. Small, «Vented-Box Loudspeaker Systems», JAES 1973</li>
          <li>— R. H. Small, «Passive-Radiator Loudspeaker Systems», JAES 1974</li>
          <li>— L. J. S. Bradbury, «The Use of Fibrous Materials in Loudspeaker Enclosures», JAES 1976</li>
          <li>— Garai &amp; Pompoli, «A simple empirical model of polyester fibre materials», Applied Acoustics 2005</li>
          <li>— Bies &amp; Hansen, resistività al flusso delle lane minerali, 1980</li>
          <li>— Miki, revisione del modello di Delany-Bazley, 1990</li>
          <li>— L. L. Beranek, «Acoustics» — analogia delle impedenze acustiche, da cui vengono i circuiti equivalenti</li>
          <li>— H. F. Olson, misure di diffrazione sulle sagome di mobile (effetto pannello)</li>
          <li>— W. M. Leach Jr., «Loudspeaker Voice-Coil Inductance Losses», JAES 2002</li>
          <li>— J. Blauert e P. Laws, «Group Delay Distortions in Electroacoustical Systems», JASA 1978</li>
        </ul>
      </div>
    </div>
  );
}

export function Glossario({ slug, onNavigate }: { slug?: string; onNavigate?: Naviga }) {
  const entry = slug ? GLOSSARY_BY_ID[slug] : undefined;
  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative">
        {entry ? <Voce entry={entry} naviga={onNavigate} /> : <Indice naviga={onNavigate} />}
      </div>
    </div>
  );
}
