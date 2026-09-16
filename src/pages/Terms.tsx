/**
 * Condizioni d'uso.
 *
 * La versione precedente erano condizioni generali di VENDITA: prezzi, IVA,
 * carrello, Stripe, PayPal, corrieri espressi, diritto di recesso, garanzia di
 * conformità sui prodotti consegnati. Erano i testi del sito da cui questo è
 * nato, ed erano rimasti in piedi dopo che il sito è diventato un calcolatore.
 *
 * Qui non c'è niente da comprare: nessun prezzo, nessun ordine, nessun
 * pagamento, nessuna consegna. Una pagina che promette un diritto di recesso su
 * acquisti che non esistono non è un eccesso di zelo, è un'informazione falsa —
 * e in una pagina legale è la cosa peggiore che ci possa stare.
 *
 * Restano i dati identificativi di chi gestisce il sito, che vanno dichiarati
 * comunque, e le poche cose che valgono davvero per uno strumento di calcolo
 * gratuito: cosa si può fare con i risultati, e fin dove risponde chi lo ha
 * scritto.
 */

import { useSEO } from '../hooks/useSEO';
import { Annot, Griglia, Tavola } from '../components/blueprint';

const AGGIORNATO = '17 settembre 2026';

export function Terms() {
  useSEO({
    title: 'Condizioni d’uso',
    description:
      'Chi gestisce il sito, cosa si può fare con i risultati del calcolatore e fin dove risponde chi lo ha scritto. Non si vende niente.',
    url: '/termini',
  });

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 92</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Condizioni</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-5">
            Cosa puoi <span className="text-marker">farci</span>
          </h1>
          <p className="text-lg text-graphite leading-relaxed max-w-3xl">
            Officina del Suono è uno strumento di calcolo gratuito. Non vende niente, non chiede di
            registrarsi, non prende pagamenti e non spedisce nulla: qui sotto c’è solo quello che serve
            davvero sapere prima di usarlo.
          </p>
          <p className="annot mt-4">Ultimo aggiornamento: {AGGIORNATO}</p>
        </div>

        <div className="space-y-10">

          <Sezione numero="1" titolo="Chi gestisce il sito">
            <Tavola className="p-5">
              <p className="text-paper/90 leading-relaxed font-mono text-[13px]">
                Officinadelsuono di Amerigo De Cristofaro — Ditta individuale<br />
                Strada Provinciale 30, 83020 Forino (AV), Italia<br />
                P.IVA 03243690645 — REA AV 314125<br />
                PEC amerigodecristofaro@pec.it<br />
                Email info@officina-del-suono.it
              </p>
            </Tavola>
          </Sezione>

          <Sezione numero="2" titolo="Che cos’è questo sito">
            <p>
              Un calcolatore per casse acustiche e per l’impianto a valle, con le schede che spiegano ogni
              parametro. È gratuito e senza pubblicità, non richiede registrazione e non ha un carrello.
            </p>
            <p>
              Quello che inserisci resta nel tuo browser: non viene inviato da nessuna parte. I dettagli
              stanno nell’<a href="/privacy" className="text-marker hover:underline">informativa privacy</a>.
            </p>
          </Sezione>

          <Sezione numero="3" titolo="I risultati sono tuoi">
            <p>
              Volumi, accordi, misure, liste di taglio e curve che il calcolatore produce li puoi usare come
              vuoi, anche per casse che poi vendi. Non c’è nessuna licenza da chiedere, nessun canone e
              nessun credito da dare.
            </p>
            <p>
              Il codice del sito è pubblico e ha la sua licenza, che sta nel{' '}
              <a
                href="https://github.com/djam3/officinadelsuono"
                target="_blank"
                rel="noopener noreferrer"
                className="text-marker hover:underline"
              >
                repository
              </a>
              : quella riguarda il programma, non i numeri che ne escono.
            </p>
          </Sezione>

          <Sezione numero="4" titolo="Quello che il calcolatore non garantisce">
            <p>
              I conti sono quelli della letteratura pubblicata e ogni scheda dice da dove vengono, ma un
              calcolo resta un modello: descrive una cassa costruita bene con un driver i cui parametri sono
              davvero quelli dichiarati. Sono due ipotesi, e la seconda è la più fragile — è il motivo per
              cui il calcolatore ha una sezione apposta sulla dispersione di produzione e una per misurare
              il tuo esemplare.
            </p>
            <p>
              <strong className="text-paper">Verifica prima di tagliare</strong>, e misura prima di mettere
              il tuo nome su una cassa. Chi ha scritto questo strumento non risponde di legno tagliato male,
              driver bruciati, casse che non suonano come speravi o lavori rifatti: la responsabilità di
              quello che costruisci è tua, e nessun calcolo la sposta.
            </p>
            <p>
              Vale anche per la parte sull’impianto elettrico. Quei conti servono a dimensionare, non
              sostituiscono le norme in vigore né chi è abilitato a fare un impianto: un collegamento alla
              rete elettrica lo fa un elettricista.
            </p>
          </Sezione>

          <Sezione numero="5" titolo="Disponibilità">
            <p>
              Il sito è un progetto personale, non un servizio con un impegno di continuità: può cambiare,
              fermarsi o sparire senza preavviso. Se un progetto ti serve, salvatelo — il collegamento
              condivisibile contiene tutti i dati e la lista di taglio si stampa.
            </p>
          </Sezione>

          <Sezione numero="6" titolo="Modifiche e legge applicabile">
            <p>
              Queste condizioni possono cambiare; la data in cima dice quando è successo l’ultima volta.
              Si applica la legge italiana.
            </p>
          </Sezione>

        </div>
      </div>
    </div>
  );
}

function Sezione({ numero, titolo, children }: {
  numero: string; titolo: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <Annot tone="blueprint">{numero}</Annot>
        <h2 className="titolo text-2xl">{titolo}</h2>
      </div>
      <div className="space-y-4 text-graphite leading-relaxed max-w-3xl">{children}</div>
    </section>
  );
}
