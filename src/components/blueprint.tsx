/**
 * Kit grafico "tavola di disegno".
 *
 * Gli elementi ricorrenti di un disegno tecnico, riusabili come componenti:
 * la griglia millimetrata, il cartiglio, le linee di quota, il righello e le
 * annotazioni a bordo foglio. Servono a dare al sito la stessa grammatica del
 * calcolatore, che di disegni tecnici ne produce davvero.
 */

import type { ReactNode } from 'react';

/** Griglia millimetrata di fondo, da mettere come primo figlio di un contenitore relative */
export function Griglia({ fade = true, className = '' }: { fade?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none blueprint-grid ${fade ? 'blueprint-fade' : ''} ${className}`}
    />
  );
}

/** Annotazione monospaziata a bordo tavola */
export function Annot({
  children, tone = 'graphite', className = '',
}: { children: ReactNode; tone?: 'graphite' | 'blueprint' | 'marker'; className?: string }) {
  const t = tone === 'blueprint' ? 'annot-blue' : tone === 'marker' ? 'annot-marker' : '';
  return <span className={`annot ${t} ${className}`}>{children}</span>;
}

/** Divisore a righello */
export function Righello({ fitto = false, className = '' }: { fitto?: boolean; className?: string }) {
  return <div aria-hidden className={`${fitto ? 'righello-fitto' : 'righello'} ${className}`} />;
}

/**
 * Linea di quota con il valore al centro, come sotto una misura di disegno.
 * Orizzontale per impostazione, verticale quando serve incorniciare un blocco.
 */
export function Quota({ valore, className = '' }: { valore: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <div className="quota flex-1" />
      <span className="annot annot-blue shrink-0">{valore}</span>
      <div className="quota flex-1" />
    </div>
  );
}

/** Pannello base: bordo sottile e riferimenti d'angolo */
export function Tavola({
  children, hover = false, className = '',
}: { children: ReactNode; hover?: boolean; className?: string }) {
  return (
    <div className={`tavola ${hover ? 'tavola-hover' : ''} ${className}`}>{children}</div>
  );
}

export interface CampoCartiglio {
  etichetta: string;
  valore: string;
}

/**
 * Cartiglio: il riquadro in basso a destra di ogni tavola, dove stanno il nome
 * del progetto, la scala, il numero del foglio. Qui fa da intestazione o da
 * piede di pagina, e porta le informazioni che identificano la sezione.
 */
export function Cartiglio({
  titolo, campi, className = '',
}: { titolo?: string; campi: CampoCartiglio[]; className?: string }) {
  return (
    <div className={`tavola ${className}`}>
      {titolo && (
        <div className="px-4 py-2.5 border-b border-paper/10">
          <span className="annot annot-marker">{titolo}</span>
        </div>
      )}
      <dl className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-paper/10">
        {campi.map(c => (
          <div key={c.etichetta} className="px-4 py-3 min-w-0">
            <dt className="annot block mb-1 truncate">{c.etichetta}</dt>
            <dd className="font-mono text-sm text-paper truncate">{c.valore}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Intestazione di sezione: numero progressivo come su una tavola numerata,
 * titolo, e la riga di quota che lo sottolinea.
 */
export function IntestazioneSezione({
  numero, occhiello, titolo, sottotitolo, className = '',
}: {
  numero?: string;
  occhiello?: string;
  titolo: ReactNode;
  sottotitolo?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-3 mb-3">
        {numero && <span className="annot annot-blue">{numero}</span>}
        {occhiello && <Annot tone="marker">{occhiello}</Annot>}
      </div>
      <h2 className="titolo text-3xl md:text-4xl text-paper mb-3">{titolo}</h2>
      <div className="quota max-w-[140px] mb-4 animate-tratto" aria-hidden />
      {sottotitolo && (
        <p className="text-graphite leading-relaxed max-w-2xl">{sottotitolo}</p>
      )}
    </div>
  );
}
