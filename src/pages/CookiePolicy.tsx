/**
 * Cookie.
 *
 * La versione precedente elencava cookie tecnici per la sessione di
 * autenticazione, il carrello e la prevenzione frodi, e fra le terze parti
 * Stripe, Resend e i video incorporati nel blog. Niente di tutto questo esiste:
 * non c'è login, non c'è carrello, non c'è blog.
 *
 * La verità è più corta e molto più rassicurante: aprendo il sito non parte
 * nessuna richiesta verso l'esterno e non viene scritto nessun cookie. L'unica
 * cosa che resta sul dispositivo è la memoria locale del calcolatore, che è
 * un'altra cosa — non viaggia con le richieste e non la vede nessun server.
 *
 * Il banner resta perché il sito è predisposto per le statistiche di visita, e
 * perché se un giorno verranno accese dovranno partire dopo il consenso e non
 * prima. Quel «dopo» ora è vero anche nel codice: il caricamento degli script
 * di terze parti sta dietro alla scelta fatta qui.
 */

import { useSEO } from '../hooks/useSEO';
import { Annot, Griglia, Tavola } from '../components/blueprint';

const AGGIORNATO = '17 settembre 2026';

export function CookiePolicy() {
  useSEO({
    title: 'Cookie',
    description:
      'Il sito non scrive cookie e non carica script di terze parti. Cosa resta sul dispositivo, perché, e come cambiare idea.',
    url: '/cookie-policy',
  });

  const riapriPreferenze = () => {
    localStorage.removeItem('cookie-consent');
    window.dispatchEvent(new Event('cookie-consent-reset'));
  };

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 94</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Cookie</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-5">
            Cookie: <span className="text-marker">nessuno</span>
          </h1>
          <p className="text-lg text-graphite leading-relaxed max-w-3xl">
            Aprendo questo sito non viene scritto nessun cookie e non parte nessuna richiesta verso
            l’esterno: le pagine, i caratteri e le immagini arrivano tutti da qui. Il banner c’è perché il
            sito è predisposto per le statistiche di visita, ma oggi non sono attive.
          </p>
          <p className="annot mt-4">Ultimo aggiornamento: {AGGIORNATO}</p>
        </div>

        <div className="space-y-10">

          <Sezione numero="1" titolo="Cookie e memoria locale non sono la stessa cosa">
            <p>
              Un <strong className="text-paper">cookie</strong> è un dato che il browser allega
              automaticamente a ogni richiesta verso il sito: per questo è il cookie a essere regolato, e
              non il semplice fatto che qualcosa resti sul dispositivo.
            </p>
            <p>
              La <strong className="text-paper">memoria locale</strong> che usa il calcolatore per non farti
              perdere il progetto non viene allegata a niente: resta sul tuo dispositivo, non viaggia, e
              nessun server la vede. Cosa contiene esattamente sta{' '}
              <a href="/privacy" className="text-marker hover:underline">nell’informativa privacy</a>.
            </p>
          </Sezione>

          <Sezione numero="2" titolo="Cosa c’è oggi">
            <Tavola className="p-5">
              <dl className="space-y-3 text-[15px]">
                <Voce k="Cookie scritti dal sito" v="nessuno" />
                <Voce k="Script di terze parti caricati" v="nessuno" />
                <Voce k="Richieste verso altri domini" v="nessuna" />
                <Voce k="Memoria locale" v="i progetti e la scelta fatta qui sotto" />
              </dl>
            </Tavola>
            <p>
              L’unica cosa che il banner salva è la tua risposta, in memoria locale sotto la
              chiave <code className="font-mono text-[13px] text-paper">cookie-consent</code>. Serve a non
              richiedertela a ogni visita.
            </p>
          </Sezione>

          <Sezione numero="3" titolo="Cosa succederebbe se le statistiche venissero accese">
            <p>
              Il sito è predisposto per Google Analytics e per il pixel di Meta. Finché gli identificativi
              non sono configurati, quel codice non fa niente — ed è la situazione attuale.
            </p>
            <p>
              Se venissero configurati, gli script partirebbero solo dopo un consenso dato qui, distinto fra
              statistiche e marketing: rifiutando, non viene caricato niente. Non è una promessa scritta in
              una pagina, è come funziona il caricamento — la scelta sta prima dello script, non dopo.
            </p>
            <p>
              Base giuridica: consenso, art. 6.1.a GDPR e art. 122 del Codice Privacy. Puoi revocarlo in
              qualsiasi momento qui sotto; se qualcosa era già stato caricato, la pagina si ricarica per
              toglierlo di mezzo.
            </p>
          </Sezione>

          <Sezione numero="4" titolo="Cambiare idea">
            <p>
              Il pulsante riapre il banner e azzera la scelta precedente.
            </p>
            <button type="button" onClick={riapriPreferenze} className="btn-marker mt-2">
              Rivedi le preferenze
            </button>
            <p>
              In alternativa, puoi cancellare i dati di questo sito dalle impostazioni del browser —{' '}
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-marker hover:underline">Chrome</a>,{' '}
              <a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer" className="text-marker hover:underline">Firefox</a>,{' '}
              <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-marker hover:underline">Safari</a>,{' '}
              <a href="https://support.microsoft.com/it-it/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-marker hover:underline">Edge</a>{' '}
              — tenendo presente che così perdi anche i progetti salvati nel calcolatore.
            </p>
          </Sezione>

          <Sezione numero="5" titolo="Titolare del trattamento">
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

        </div>
      </div>
    </div>
  );
}

function Voce({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-paper/[0.06] pb-2">
      <dt className="text-graphite">{k}</dt>
      <dd className="font-mono text-marker shrink-0">{v}</dd>
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
