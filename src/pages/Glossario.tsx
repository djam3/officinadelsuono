/**
 * Glossario tecnico: indice delle voci e pagina della singola voce.
 *
 * Una sola pagina serve entrambi i casi, perché la differenza è solo se lo
 * slug c'è o no. Le schede sono raggiunte dalla ⓘ accanto a ogni campo del
 * calcolatore, che le apre in una scheda nuova per non perdere il progetto in
 * corso.
 */

import { ArrowLeft, BookOpen, Info, Link2, AlertTriangle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import {
  CATEGORY_INTRO, CATEGORY_LABELS, GLOSSARY, GLOSSARY_BY_ID, glossaryUrl,
  type GlossaryBlock, type GlossaryCategory, type GlossaryEntry,
} from '../data/glossary';

const ORDER: GlossaryCategory[] = ['driver', 'cassa', 'condotto', 'materiali', 'costruzione'];

function Blocks({ blocks }: { blocks: GlossaryBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <section key={i} className="mb-8">
          {b.heading && (
            <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3">{b.heading}</h2>
          )}
          {b.paragraphs?.map((p, j) => (
            <p key={j} className="text-zinc-300 leading-relaxed mb-3">{p}</p>
          ))}
          {b.formula && (
            <div className="my-4 bg-zinc-900/70 border border-white/10 rounded-xl px-5 py-4">
              <code className="block text-brand-orange font-mono text-sm sm:text-base">{b.formula.expr}</code>
              {b.formula.caption && (
                <span className="block text-[11px] text-zinc-500 mt-2 leading-relaxed">{b.formula.caption}</span>
              )}
            </div>
          )}
          {b.list && (
            <ul className="space-y-2 mt-3">
              {b.list.map((li, j) => (
                <li key={j} className="text-zinc-300 leading-relaxed flex gap-3">
                  <span className="text-brand-orange shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          )}
          {b.callout && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 flex gap-3 border ${
                b.callout.kind === 'attenzione'
                  ? 'bg-amber-500/5 border-amber-500/25'
                  : 'bg-white/[0.03] border-white/10'
              }`}
            >
              {b.callout.kind === 'attenzione'
                ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                : <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />}
              <p className="text-sm text-zinc-300 leading-relaxed">{b.callout.text}</p>
            </div>
          )}
        </section>
      ))}
    </>
  );
}

function Voce({ entry }: { entry: GlossaryEntry }) {
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
        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-brand-orange transition-colors mb-8 uppercase tracking-[0.2em] font-black"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Glossario
      </a>

      <div className="mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">
          {CATEGORY_LABELS[entry.category]}
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mt-3 mb-1">
          <span className="text-brand-orange">{entry.symbol}</span>
          {entry.unit && <span className="text-zinc-600 text-2xl md:text-3xl ml-3">{entry.unit}</span>}
        </h1>
        <p className="text-xl text-zinc-400 font-medium">{entry.title}</p>
        <p className="text-zinc-500 mt-4 leading-relaxed">{entry.summary}</p>
      </div>

      {entry.typical && (
        <div className="mb-10 bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
            Valori tipici
          </h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {entry.typical.map(t => (
              <div key={t.label} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
                <dt className="text-sm text-zinc-400">{t.label}</dt>
                <dd className="text-sm font-mono text-white shrink-0">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <Blocks blocks={entry.blocks} />

      {entry.sources && (
        <div className="mt-12 pt-6 border-t border-white/10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
            Da dove vengono questi numeri
          </h2>
          <ul className="space-y-1.5">
            {entry.sources.map((s, i) => (
              <li key={i} className="text-[12px] text-zinc-500 leading-relaxed">— {s}</li>
            ))}
          </ul>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-10 pt-6 border-t border-white/10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
            Parametri collegati
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map(r => (
              <a
                key={r.id}
                href={glossaryUrl(r.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 hover:border-brand-orange/50 transition-colors"
              >
                <Link2 className="w-3 h-3 text-brand-orange" />
                <span className="text-sm text-zinc-300">{r.symbol}</span>
                <span className="text-[11px] text-zinc-600 hidden sm:inline">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <a
          href="/progetta-cassa"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-black font-black uppercase tracking-wider text-xs hover:bg-brand-orange/90 transition-colors"
        >
          Torna al calcolatore
        </a>
      </div>
    </article>
  );
}

function Indice() {
  useSEO({
    title: 'Glossario dei parametri Thiele-Small e di progettazione casse',
    description: 'Una scheda per ogni parametro del calcolatore: che cos’è, a cosa serve nel progetto, quali valori aspettarsi e dove si sbaglia.',
    url: '/glossario',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 mb-5">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Glossario</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase">
          I parametri, <span className="text-brand-orange">spiegati</span>
        </h1>
        <p className="text-zinc-400 max-w-3xl leading-relaxed">
          Una scheda per ogni campo del calcolatore. Ognuna risponde alle stesse quattro domande: che cos&rsquo;è,
          a cosa serve nel progetto, quali valori aspettarsi e dove si sbaglia di solito. I numeri citati vengono
          dalla letteratura tecnica pubblicata o da verifiche fatte sul motore di calcolo, e ogni scheda dice
          quali.
        </p>
      </div>

      {ORDER.map(cat => {
        const voci = GLOSSARY.filter(e => e.category === cat);
        if (!voci.length) return null;
        return (
          <section key={cat} className="mb-14">
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">{CATEGORY_LABELS[cat]}</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-3xl leading-relaxed">{CATEGORY_INTRO[cat]}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {voci.map(e => (
                <a
                  key={e.id}
                  href={glossaryUrl(e.id)}
                  className="block p-4 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-brand-orange/50 transition-colors group"
                >
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-brand-orange font-black">{e.symbol}</span>
                    {e.unit && <span className="text-[11px] text-zinc-600">{e.unit}</span>}
                  </div>
                  <p className="text-sm text-zinc-300 font-medium mb-1.5 group-hover:text-white transition-colors">
                    {e.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{e.summary}</p>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-4 pt-8 border-t border-white/10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Riferimenti principali</h2>
        <ul className="space-y-1.5 text-[12px] text-zinc-500 leading-relaxed max-w-3xl">
          <li>— A. N. Thiele, «Loudspeakers in Vented Boxes», JAES 1971</li>
          <li>— R. H. Small, «Direct-Radiator Loudspeaker System Analysis», JAES 1972</li>
          <li>— R. H. Small, «Closed-Box Loudspeaker Systems», JAES 1972–73</li>
          <li>— R. H. Small, «Vented-Box Loudspeaker Systems», JAES 1973</li>
          <li>— R. H. Small, «Passive-Radiator Loudspeaker Systems», JAES 1974</li>
          <li>— L. J. S. Bradbury, «The Use of Fibrous Materials in Loudspeaker Enclosures», JAES 1976</li>
          <li>— Garai &amp; Pompoli, «A simple empirical model of polyester fibre materials», Applied Acoustics 2005</li>
          <li>— Bies &amp; Hansen, resistività al flusso delle lane minerali, 1980</li>
          <li>— Miki, revisione del modello di Delany-Bazley, 1990</li>
          <li>— L. L. Beranek, «Acoustics»</li>
        </ul>
      </div>
    </div>
  );
}

export function Glossario({ slug }: { slug?: string }) {
  const entry = slug ? GLOSSARY_BY_ID[slug] : undefined;
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-24">
      {entry ? <Voce entry={entry} /> : <Indice />}
    </div>
  );
}
