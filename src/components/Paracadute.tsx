/**
 * Quando qualcosa si rompe, non resta una pagina bianca.
 *
 * In React un errore lanciato durante il disegno di un componente non viene
 * fermato da nessuno: risale fino alla radice e smonta TUTTO. Non si vede un
 * pezzo rotto e il resto che funziona — si vede il vuoto, senza nemmeno un
 * messaggio. È successo due volte mentre costruivo questo sito, e le due volte
 * la causa era in un dettaglio di una singola sezione.
 *
 * Un confine di errore è l'unico modo per fermare la caduta. Non ripara
 * niente: circoscrive. La parte rotta viene sostituita da un riquadro che dice
 * cosa è successo e offre di riprovare, e tutto il resto della pagina resta in
 * piedi e utilizzabile.
 *
 * IL DETTAGLIO CHE CONTA DAVVERO. Sul calcolatore i dati inseriti vivono nella
 * memoria del browser, e un valore particolare può far cadere il calcolo a
 * ogni caricamento: si riaprirebbe la pagina e si troverebbe lo stesso errore
 * per sempre, senza via d'uscita. Per questo il riquadro offre anche di
 * buttare via i dati salvati: è la scala antincendio.
 */

import React from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** cosa si stava mostrando, per dirlo all'utente */
  dove?: string;
  /** true se questa parte legge dati salvati che potrebbero essere la causa */
  offriPulizia?: boolean;
}

interface Stato {
  errore: Error | null;
}

export class Paracadute extends React.Component<Props, Stato> {
  state: Stato = { errore: null };

  static getDerivedStateFromError(errore: Error): Stato {
    return { errore };
  }

  componentDidCatch(errore: Error, info: React.ErrorInfo) {
    // in sviluppo serve lo stack completo per capire dove; in produzione
    // resta comunque nella console di chi segnala il problema
    console.error('Errore in', this.props.dove ?? 'una parte della pagina', errore, info.componentStack);
  }

  private riprova = () => this.setState({ errore: null });

  private pulisci = () => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('ods:')) localStorage.removeItem(k);
      }
    } catch {
      // se non si può cancellare, il ricaricamento è comunque l'ultima spiaggia
    }
    window.location.reload();
  };

  render() {
    const { errore } = this.state;
    if (!errore) return this.props.children;

    return (
      <div className="tavola p-6 md:p-8" role="alert">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-segnale shrink-0 mt-1" strokeWidth={1.6} />
          <div className="min-w-0">
            <h2 className="titolo text-xl mb-3">
              Qui si è rotto qualcosa
            </h2>
            <p className="text-graphite leading-relaxed mb-4 max-w-2xl">
              {this.props.dove
                ? `La parte «${this.props.dove}» non è riuscita a disegnarsi.`
                : 'Questa parte della pagina non è riuscita a disegnarsi.'}{' '}
              Il resto del sito funziona: puoi continuare da un&rsquo;altra scheda. È un difetto del
              programma, non un tuo errore di inserimento.
            </p>

            <pre className="text-[11px] font-mono text-graphite-dim bg-ink/70 border border-paper/10 p-3 overflow-x-auto mb-5">
              {errore.message || String(errore)}
            </pre>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={this.riprova} className="btn-tratto">
                <RotateCcw className="w-4 h-4" /> Riprova
              </button>
              {this.props.offriPulizia && (
                <button type="button" onClick={this.pulisci} className="btn-tratto">
                  <Trash2 className="w-4 h-4" /> Ricomincia da capo
                </button>
              )}
              <a
                href={`mailto:info@officina-del-suono.it?subject=${encodeURIComponent('Officina del Suono — errore')}&body=${encodeURIComponent(`Errore in: ${this.props.dove ?? 'pagina'}\n\n${errore.message}`)}`}
                className="btn-tratto"
              >
                Segnalalo
              </a>
            </div>

            {this.props.offriPulizia && (
              <p className="text-[11px] text-graphite-dim mt-4 leading-relaxed max-w-2xl">
                Se l&rsquo;errore torna a ogni caricamento, la causa è quasi certamente nei dati salvati nel
                browser: «Ricomincia da capo» li cancella e riparte dai valori d&rsquo;esempio.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}
