/**
 * Contatti.
 *
 * La versione precedente rispondeva a domande che questo sito non pone —
 * tempi di risposta per gli ordini, consulenza sull'acquisto, zona servita.
 * Erano i testi del progetto da cui il sito è nato.
 *
 * Qui non c'è niente da ordinare: le domande vere che arrivano a uno strumento
 * di calcolo sono altre, e le prime tre di questa pagina sono quelle che il
 * calcolatore stesso solleva più spesso nei suoi avvisi.
 */

import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { Mail, MessageCircle, ChevronDown, Bug, BookOpen } from 'lucide-react';
import { Annot, Griglia, Tavola } from '../components/blueprint';

const EMAIL = 'info@officina-del-suono.it';
const WHATSAPP = '393477397016';

const DOMANDE = [
  {
    d: 'Il calcolatore mi dice che i parametri del mio driver non tornano. Chi ha ragione?',
    r: 'Il controllo è aritmetico: fra Qms, Qes e Qts vale un’identità esatta, e se i tre valori dichiarati non la rispettano uno dei tre è sbagliato — quasi sempre perché arriva da un campione diverso o è stato arrotondato male. Il calcolatore non sceglie per te quale credere: ti dice quale scarto ha trovato e su quale grandezza. Se hai la scheda ufficiale del costruttore, quella vince su qualsiasi database.',
  },
  {
    d: 'La risposta calcolata sarà quella che sentirò?',
    r: 'No, e non per un limite del programma. La curva è in spazio libero: sotto i 200 Hz quello che senti lo decide la stanza, che può aggiungere o togliere più di 10 dB a seconda di dove sei seduto. Il calcolo ti dice come si comporta la cassa; dove metterla è un altro problema, e più grosso.',
  },
  {
    d: 'Il condotto mi viene lunghissimo e non ci sta nella cassa. È un errore?',
    r: 'No, è la fisica del risonatore: a parità di accordo, più il volume è piccolo più il condotto è lungo, e allargare la sezione lo allunga ancora. Le vie d’uscita sono tre e il calcolatore te le propone: ripiegarlo a L o a U, usare un radiatore passivo, o accettare un accordo più alto. Un condotto troppo stretto per farlo entrare è la scelta sbagliata: soffia.',
  },
  {
    d: 'Posso usare i risultati per una cassa che poi vendo?',
    r: 'Sì. Non c’è nessuna licenza da chiedere e nessun credito da dare. Ma i numeri vanno verificati con una misura prima di metterci il tuo nome sopra: nessun calcolo, per quanto controllato, sa com’è venuta la tua cassa.',
  },
  {
    d: 'Perché è gratis?',
    r: 'Perché è un progetto personale e non ha costi da coprire: niente pubblicità, niente registrazione, niente dati raccolti oltre a quelli che il tuo browser tiene per conto suo. Se ti è servito, la cosa più utile che puoi fare è segnalare un errore.',
  },
];

export function Contact() {
  useSEO({
    title: 'Contatti e domande frequenti',
    description:
      'Come segnalare un errore di calcolo, e le domande che il calcolatore solleva più spesso: parametri che non tornano, risposta in ambiente, condotti troppo lunghi.',
    url: '/contatti',
  });

  const [aperta, setAperta] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 91</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Contatti</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-5">
            Se un numero <span className="text-marker">non torna</span>
          </h1>
          <p className="text-lg text-graphite leading-relaxed max-w-3xl">
            È la segnalazione più utile che si possa fare a uno strumento come questo, e vale più di
            qualsiasi complimento. Scrivi cosa hai inserito e cosa ti aspettavi: con quei due dati l’errore
            si trova, o si scopre che l’errore non c’è e va spiegato meglio.
          </p>
        </div>

        {/* ── come scrivere ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          <a href={`mailto:${EMAIL}?subject=Officina%20del%20Suono%20%E2%80%94%20segnalazione`}
            className="tavola tavola-hover p-6 block group">
            <Mail className="w-5 h-5 text-marker mb-4" strokeWidth={1.5} />
            <p className="text-paper font-medium mb-1 group-hover:text-white transition-colors">Email</p>
            <p className="font-mono text-sm text-graphite break-all">{EMAIL}</p>
            <p className="text-[11px] text-graphite-dim mt-3 leading-relaxed">
              Per una segnalazione con dei numeri dentro: è il canale giusto, perché si possono allegare i
              parametri e la scheda del driver.
            </p>
          </a>

          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
            className="tavola tavola-hover p-6 block group">
            <MessageCircle className="w-5 h-5 text-marker mb-4" strokeWidth={1.5} />
            <p className="text-paper font-medium mb-1 group-hover:text-white transition-colors">WhatsApp</p>
            <p className="font-mono text-sm text-graphite">+39 347 7397016</p>
            <p className="text-[11px] text-graphite-dim mt-3 leading-relaxed">
              Per una domanda corta. Non è un servizio di assistenza: è una persona sola, e risponde quando
              può.
            </p>
          </a>
        </div>

        {/* ── prima di scrivere ── */}
        <Tavola className="p-6 mb-14">
          <div className="flex items-start gap-4">
            <BookOpen className="w-5 h-5 text-blueprint shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <p className="text-paper font-medium mb-2">Prima di scrivere, prova la ⓘ</p>
              <p className="text-graphite leading-relaxed text-[15px]">
                Accanto a ogni campo c’è un collegamento alla scheda di quel parametro, e la maggior parte
                delle domande che arrivano hanno già la risposta lì — comprese quelle sui risultati che
                sembrano sbagliati e non lo sono.
              </p>
            </div>
          </div>
        </Tavola>

        {/* ── domande ── */}
        <div className="flex items-baseline gap-3 mb-6">
          <Bug className="w-4 h-4 text-marker" strokeWidth={1.6} />
          <h2 className="titolo text-2xl">Quelle che arrivano più spesso</h2>
        </div>

        <div className="border border-paper/10">
          {DOMANDE.map((q, i) => {
            const on = aperta === i;
            return (
              <div key={q.d} className={i > 0 ? 'border-t border-paper/10' : ''}>
                <button
                  type="button"
                  onClick={() => setAperta(on ? null : i)}
                  aria-expanded={on}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-ink-2/60 transition-colors"
                >
                  <span className={`text-[15px] leading-relaxed ${on ? 'text-marker' : 'text-paper'}`}>
                    {q.d}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 mt-1 text-graphite transition-transform ${on ? 'rotate-180' : ''}`}
                  />
                </button>
                {on && (
                  <p className="px-5 pb-5 -mt-1 text-graphite leading-relaxed text-[15px] max-w-3xl">
                    {q.r}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
