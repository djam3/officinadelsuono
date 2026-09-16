/**
 * Informativa privacy.
 *
 * La versione precedente dichiarava di raccogliere nome, cognome, password,
 * indirizzo di fatturazione e spedizione, codice fiscale, dettagli dell'ordine
 * e metodo di pagamento, e nominava Stripe e i corrieri espressi fra i
 * responsabili del trattamento. Non è vero niente: non c'è registrazione, non
 * c'è carrello, non c'è pagamento, e il sito non ha un database.
 *
 * Un'informativa che descrive un trattamento che non esiste è peggio di
 * nessuna informativa: chi la legge non può farci nessuna delle cose per cui
 * serve — sapere che dati ci sono in giro, e chiederne conto.
 *
 * Questa descrive quello che il sito fa davvero, che è pochissimo: tiene i
 * progetti nella memoria del browser e non li manda a nessuno. La parte sui
 * diritti resta, perché è legge e vale comunque.
 */

import { useSEO } from '../hooks/useSEO';
import { Annot, Griglia, Tavola } from '../components/blueprint';

const AGGIORNATO = '17 settembre 2026';

export function Privacy() {
  useSEO({
    title: 'Informativa privacy',
    description:
      'Quello che il sito fa davvero con i tuoi dati: li tiene nel tuo browser e non li manda a nessuno. Nessun account, nessun database, nessun pagamento.',
    url: '/privacy',
  });

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 93</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Privacy</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-5">
            I tuoi dati <span className="text-marker">restano qui</span>
          </h1>
          <p className="text-lg text-graphite leading-relaxed max-w-3xl">
            Tutto quello che scrivi nel calcolatore — parametri del driver, misure, progetti salvati — sta
            nella memoria del browser che stai usando, su questo dispositivo. Non passa da nessun server,
            non finisce in nessun database, e chi gestisce il sito non lo vede.
          </p>
          <p className="annot mt-4">Ultimo aggiornamento: {AGGIORNATO}</p>
        </div>

        <div className="space-y-10">

          <Sezione numero="1" titolo="Titolare del trattamento">
            <Tavola className="p-5">
              <p className="text-paper/90 leading-relaxed font-mono text-[13px]">
                Officinadelsuono di Amerigo De Cristofaro — Ditta individuale<br />
                Strada Provinciale 30, 83020 Forino (AV), Italia<br />
                P.IVA 03243690645 — REA AV 314125<br />
                PEC amerigodecristofaro@pec.it<br />
                Email info@officina-del-suono.it
              </p>
            </Tavola>
            <p>
              Informativa resa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR).
            </p>
          </Sezione>

          <Sezione numero="2" titolo="Cosa il sito NON fa">
            <p>
              Vale la pena dirlo prima del resto, perché è quasi tutto:
            </p>
            <ul className="space-y-2">
              <li>— Non c’è registrazione, non ci sono account e non ci sono password.</li>
              <li>— Non c’è niente da comprare: nessun ordine, nessun pagamento, nessuna spedizione.</li>
              <li>— Non c’è un database: il sito è fatto di sole pagine, senza un archivio dietro.</li>
              <li>— Non c’è newsletter e non ci sono comunicazioni commerciali.</li>
              <li>— I tuoi progetti non vengono raccolti, letti, analizzati né rivenduti.</li>
            </ul>
          </Sezione>

          <Sezione numero="3" titolo="Quello che resta nel tuo browser">
            <p>
              Il calcolatore salva nella memoria locale del browser (<code className="font-mono text-[13px] text-paper">localStorage</code>)
              i dati che inserisci, così un aggiornamento della pagina non ti fa perdere il lavoro:
              parametri del driver e configurazione, scelte sulla cassa e sulle misure, condizioni di
              simulazione, eventuali misure che hai fatto sul tuo esemplare, i driver che salvi con un nome
              tuo, e la scelta fatta sul banner dei cookie.
            </p>
            <p>
              È memoria del tuo dispositivo, non un servizio: quei dati non vengono trasmessi, restano solo
              lì e li cancelli quando vuoi — dal calcolatore con «Ricomincia da capo», o svuotando i dati
              del sito dalle impostazioni del browser.
            </p>
            <p>
              Il sito legge anche i parametri <code className="font-mono text-[13px] text-paper">utm_*</code> se
              arrivi da un collegamento che li contiene, e li tiene nella stessa memoria locale. Nemmeno
              quelli vengono inviati da nessuna parte.
            </p>
          </Sezione>

          <Sezione numero="4" titolo="Il collegamento condivisibile">
            <p>
              Il pulsante che crea un collegamento al progetto mette i dati <strong className="text-paper">dentro
              l’indirizzo</strong>, non su un server. Il collegamento funziona senza che niente venga
              conservato da nessuna parte, e continua a funzionare finché il sito esiste.
            </p>
            <p>
              La conseguenza da tenere a mente è semplice: chi ha il collegamento ha il progetto. Se lo
              incolli in un forum pubblico, i tuoi numeri diventano pubblici — non perché il sito li
              pubblichi, ma perché stanno nell’indirizzo che hai incollato.
            </p>
          </Sezione>

          <Sezione numero="5" titolo="Statistiche di visita">
            <p>
              Il sito prevede la possibilità di attivare statistiche di visita (Google Analytics) e un pixel
              di Meta. <strong className="text-paper">Oggi non sono attivi</strong>: senza gli identificativi
              configurati non viene caricato nessuno script di terze parti, e aprendo il sito non parte
              nessuna richiesta verso l’esterno.
            </p>
            <p>
              Se un giorno venissero attivati, partirebbero solo dopo il consenso dato sul banner: il
              caricamento è subordinato a quella scelta, e rifiutando non viene caricato niente. Puoi
              cambiare idea in qualsiasi momento dal collegamento in fondo alla pagina.
            </p>
          </Sezione>

          <Sezione numero="6" titolo="Se mi scrivi">
            <p>
              Le email arrivano alla casella indicata sopra e restano lì: le leggo io, e le uso solo per
              risponderti. Se scrivi su WhatsApp, quella conversazione è soggetta alle condizioni e
              all’informativa di WhatsApp, su cui questo sito non ha alcun controllo.
            </p>
            <p>
              Le segnalazioni di errore di calcolo le conservo finché servono a correggere il difetto;
              se non vuoi che tenga il messaggio, dimmelo e lo cancello.
            </p>
          </Sezione>

          <Sezione numero="7" titolo="Dove sta il sito">
            <p>
              Le pagine sono servite da Firebase Hosting, di Google. Come qualunque servizio
              di hosting, i suoi server registrano i dati tecnici della richiesta — indirizzo IP, momento,
              pagina richiesta — per servire le pagine e per sicurezza. Sono log dell’infrastruttura, non
              una raccolta fatta da questo sito, e non vengono usati per profilare nessuno.
            </p>
          </Sezione>

          <Sezione numero="8" titolo="I tuoi diritti">
            <p>
              Sui dati personali che ti riguardano hai in ogni caso i diritti previsti dagli artt. 15-22
              GDPR: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, e revoca del
              consenso in qualsiasi momento.
            </p>
            <p>
              Nel caso di questo sito, per i dati salvati nel browser li eserciti direttamente tu: sono sul
              tuo dispositivo e li cancelli quando vuoi. Per le email che mi hai mandato, scrivi a{' '}
              <a href="mailto:info@officina-del-suono.it" className="text-marker hover:underline">
                info@officina-del-suono.it
              </a>.
            </p>
            <p>
              Puoi sempre proporre reclamo al Garante per la protezione dei dati personali:{' '}
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-marker hover:underline"
              >
                garanteprivacy.it
              </a>.
            </p>
          </Sezione>

          <Sezione numero="9" titolo="Minori">
            <p>
              Il sito non è rivolto a minori di 16 anni e non raccoglie dati di nessuno — quindi nemmeno i
              loro.
            </p>
          </Sezione>

          <Sezione numero="10" titolo="Modifiche">
            <p>
              Se il sito cambierà quello che fa, questa pagina cambierà con lui: la data in cima dice
              quando è successo l’ultima volta.
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
