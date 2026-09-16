/**
 * Pagina iniziale, rifatta attorno a quello che il sito fa davvero oggi:
 * un calcolatore di casse acustiche e il glossario che lo accompagna.
 *
 * L'impianto grafico è quello della tavola di disegno — griglia millimetrata,
 * quote, cartiglio, sezioni numerate — perché è la stessa grammatica che il
 * calcolatore usa quando produce disegni e liste di taglio.
 */

import { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, Ruler, Waves, Scissors, ScrollText } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { Costruzione } from '../components/Costruzione';
import { Cassa3D } from '../components/Cassa3D';
import { Annot, Cartiglio, Griglia, IntestazioneSezione, Quota, Righello, Tavola } from '../components/blueprint';
import { GLOSSARY } from '../data/glossary';
import { DRIVER_LIBRARY } from '../data/driverLibrary';
import { ENCLOSURE_LABELS } from '../utils/audio';
import { BUSINESS, waLink } from '../config/site';

interface HomeProps {
  onNavigate: (page: string, param?: string) => void;
}

const LAVORAZIONI = [
  {
    n: '01',
    icon: Ruler,
    titolo: 'Parametri che si controllano da soli',
    corpo:
      'I parametri Thiele-Small sono legati da identità esatte. Il calcolatore le verifica tutte e accende un pallino rosso quando due valori non possono coesistere sullo stesso altoparlante — e ti dice quale relazione non torna, non solo che qualcosa non va.',
    nota: 'Verifica incrociata',
  },
  {
    n: '02',
    icon: Waves,
    titolo: 'Cinque tipi di cassa, un modello per ciascuno',
    corpo:
      'Chiusa, bass-reflex, radiatore passivo, bandpass di quarto e di sesto ordine. Ognuno con la sua fisica: il radiatore passivo non è un reflex con un tappo, e il bandpass non è una campana disegnata a mano. Curve di risposta, escursione, impedenza, fase e ritardo di gruppo.',
    nota: 'Circuito equivalente',
  },
  {
    n: '03',
    icon: Scissors,
    titolo: 'Dalla teoria al pannello da tagliare',
    corpo:
      'Volume netto e lordo, ingombri di driver e condotto, dimensioni esterne, lista di taglio pezzo per pezzo con le quote, peso stimato e metri quadri di pannello. Compreso il disegno del condotto, che cambia forma a seconda della geometria scelta.',
    nota: 'Lista di taglio',
  },
  {
    n: '04',
    icon: ScrollText,
    titolo: 'Ogni campo ha la sua scheda',
    corpo:
      'Accanto a ogni parametro c’è una ⓘ che apre una pagina dedicata: che cos’è, a cosa serve nel progetto, quali valori aspettarsi e dove si sbaglia di solito. Con le formule, i valori tipici e la fonte da cui vengono i numeri.',
    nota: 'Glossario',
  },
];

export function Home({ onNavigate }: HomeProps) {
  useSEO({
    title: 'Officina del Suono — Progettazione di casse acustiche',
    description:
      'Calcolatore per casse acustiche: parametri Thiele-Small verificati, cinque tipi di cassa, curve di risposta, dimensioni e lista di taglio. Con il glossario di ogni parametro.',
    url: '/',
  });

  const nVoci = GLOSSARY.length;
  // contato dal motore: scritto a mano diceva ancora 5, ed erano diventate 6
  const nCariche = Object.keys(ENCLOSURE_LABELS).length;
  // sotto il breakpoint largo la cassa sta sotto al testo: li' va più bassa
  const [alta, setAlta] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const agg = () => setAlta(mq.matches);
    agg();
    mq.addEventListener('change', agg);
    return () => mq.removeEventListener('change', agg);
  }, []);
  const nDriver = DRIVER_LIBRARY.length;

  return (
    <div className="bg-ink text-paper">
      {/* ═══ TAVOLA 00 — apertura ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-paper/10">
        <Griglia />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex items-baseline gap-3 mb-8 animate-fade-in-up">
            <Annot tone="blueprint">Tav. 00</Annot>
            <div className="quota flex-1 max-w-[180px]" />
            <Annot>Scala 1:1</Annot>
          </div>

          {/* Una sola griglia, non due.
              Con due griglie sovrapposte, sotto il breakpoint largo l'ordine
              diventava titolo → cassa → testo → pulsanti: si doveva scorrere
              oltre un oggetto alto 440 px per arrivare al pulsante principale.
              Qui la colonna di sinistra tiene titolo, testo e pulsanti, e la
              cassa le sta accanto: quando si impila, arriva per ultima. */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
            <div className="animate-fade-in-up">
              <h1 className="titolo text-[13vw] leading-[0.86] sm:text-7xl md:text-8xl lg:text-8xl mb-8">
                <span className="block text-paper">Si progetta</span>
                <span className="block titolo-tracciato">prima</span>
                <span className="block text-marker">di tagliare.</span>
              </h1>

              <p className="text-lg md:text-xl text-graphite leading-relaxed max-w-2xl mb-8">
                Un calcolatore per casse acustiche che non ti chiede di fidarti. Inserisci i parametri
                dell&rsquo;altoparlante e ottieni volume, accordo, condotto, dimensioni, lista di taglio e curve
                di risposta — con ogni numero riconducibile alla formula da cui esce.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => onNavigate('cabinet-designer')} className="btn-marker justify-center">
                  Apri il calcolatore <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => onNavigate('amp-designer')} className="btn-tratto justify-center">
                  Configura l&rsquo;impianto
                </button>
                <button onClick={() => onNavigate('glossary')} className="btn-tratto justify-center">
                  Glossario
                </button>
              </div>
            </div>

            {/* più contenuta quando sta sotto: lì è un'illustrazione, non il
                protagonista, e non deve mangiarsi una schermata */}
            <div className="relative animate-fade-in-up">
              <Cassa3D
                widthMm={260} heightMm={641} depthMm={267} wallMm={18}
                driverDiaMm={196}
                port={{ kind: 'fessura', widthMm: 150, heightMm: 40 }}
                quote={false}
                altezzaPx={alta ? 460 : 300}
              />
              <div className="flex items-baseline gap-3 mt-2">
                <span className="annot annot-blue">Reflex 43,1 L</span>
                <div className="quota flex-1" aria-hidden />
                <span className="annot">Trascina per girarla</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <Cartiglio
            titolo="Officina del Suono — banco di progettazione"
            campi={[
              { etichetta: 'Cariche acustiche', valore: String(nCariche) },
              { etichetta: 'Schede parametri', valore: String(nVoci) },
              { etichetta: 'Driver in libreria', valore: String(nDriver) },
              { etichetta: 'Costo', valore: 'Gratuito' },
            ]}
          />
        </div>
      </section>

      {/* ═══ TAVOLA 01 — la cassa si costruisce mentre si scorre ════════ */}
      <Costruzione />

      {/* ═══ TAVOLA 02 — cosa fa ════════════════════════════════════════ */}
      <section className="relative border-b border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <IntestazioneSezione
            numero="Tav. 02"
            occhiello="Lavorazioni"
            titolo={<>Cosa trovi <span className="text-marker">sul banco</span></>}
            sottotitolo="Quattro cose che lo strumento fa, e che puoi verificare mentre le fa."
            className="mb-14"
          />

          <div className="grid md:grid-cols-2 gap-px bg-paper/10 border border-paper/10">
            {LAVORAZIONI.map(l => (
              <div key={l.n} className="bg-ink p-7 md:p-9 relative group">
                <div className="flex items-center justify-between mb-6">
                  <Annot tone="blueprint">{l.n}</Annot>
                  <Annot>{l.nota}</Annot>
                </div>
                <l.icon className="w-7 h-7 text-marker mb-5" strokeWidth={1.4} />
                <h3 className="titolo text-xl md:text-2xl mb-3 text-paper">{l.titolo}</h3>
                <div className="quota max-w-[72px] mb-4" aria-hidden />
                <p className="text-graphite leading-relaxed text-[15px]">{l.corpo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TAVOLA 03 — il metodo ══════════════════════════════════════ */}
      <section className="relative border-b border-paper/10 mdf">
        <Griglia fade={false} className="opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <IntestazioneSezione
            numero="Tav. 03"
            occhiello="Metodo"
            titolo={<>Come faccio a dire <span className="text-marker">che è giusto</span></>}
            sottotitolo={'Un calcolatore può sbagliare in silenzio per anni. L’unico modo per accorgersene è controllarlo contro qualcosa che non dipende da lui.'}
            className="mb-14"
          />

          <div className="grid md:grid-cols-3 gap-5">
            <Tavola className="p-7">
              <Annot tone="blueprint">Casi limite</Annot>
              <p className="mt-4 text-paper leading-relaxed text-[15px]">
                Un radiatore passivo senza sospensione <em>deve</em> ridursi a un bass-reflex; con la membrana
                bloccata, a una cassa chiusa. Entrambi i controlli tornano entro tre centomillesimi di decibel.
              </p>
              <p className="mt-4 font-mono text-2xl text-marker">0,00003 dB</p>
            </Tavola>

            <Tavola className="p-7">
              <Annot tone="blueprint">Fonti pubblicate</Annot>
              <p className="mt-4 text-paper leading-relaxed text-[15px]">
                I valori delle perdite di cassa sono quelli misurati da Small nel 1973, non stime: cassa nuda
                oltre 100, rivestita 30–80, riempita 7–10. Ogni scheda del glossario dice da dove vengono i
                suoi numeri.
              </p>
              <p className="mt-4 font-mono text-2xl text-marker">JAES 1971–76</p>
            </Tavola>

            <Tavola className="p-7">
              <Annot tone="blueprint">Dati verificati</Annot>
              <p className="mt-4 text-paper leading-relaxed text-[15px]">
                I driver in libreria vengono uno per uno dalle schede tecniche ufficiali dei costruttori, con
                il link alla pagina di origine. Dove i dati del costruttore non chiudono fra loro, la scheda
                lo dice.
              </p>
              <p className="mt-4 font-mono text-2xl text-marker">{nDriver} driver</p>
            </Tavola>
          </div>
        </div>
      </section>

      {/* ═══ TAVOLA 04 — glossario ══════════════════════════════════════ */}
      <section className="relative border-b border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <IntestazioneSezione
                numero="Tav. 04"
                occhiello="Glossario"
                titolo={<>Se un campo non ti <span className="text-marker">dice niente</span></>}
                sottotitolo={`${nVoci} schede, una per parametro. Nessuna presuppone che tu sappia già cos’è: si parte da cosa significa, si arriva a cosa cambia nel progetto.`}
                className="mb-8"
              />
              <button onClick={() => onNavigate('glossary')} className="btn-tratto">
                Sfoglia il glossario <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-px bg-paper/10 border border-paper/10">
              {GLOSSARY.slice(0, 6).map(v => (
                <a
                  key={v.id}
                  href={`/glossario/${v.id}`}
                  onClick={e => {
                    // resta un link vero: ctrl/cmd-clic apre in una scheda nuova
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onNavigate('glossary', v.id);
                  }}
                  className="bg-ink p-5 hover:bg-paper/[0.03] transition-colors group"
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="titolo text-xl text-marker">{v.symbol}</span>
                    {v.unit && <Annot>{v.unit}</Annot>}
                  </div>
                  <p className="text-sm text-paper/90 group-hover:text-paper transition-colors leading-snug">
                    {v.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TAVOLA 04 — contatto ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <Griglia />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Quota valore={`${BUSINESS.area}`} className="mb-10 max-w-md" />

          <h2 className="titolo text-4xl md:text-6xl mb-6 max-w-3xl">
            Il progetto è pronto.<br />
            <span className="text-marker">Ti è tornato un numero strano?</span>
          </h2>
          <p className="text-graphite leading-relaxed max-w-2xl mb-10">
            Lo strumento ti porta fino alla lista di taglio, e prima di ogni numero c&rsquo;è una ⓘ che spiega
            da dove viene. Se qualcosa non torna, segnalarlo è la cosa più utile che puoi fare: finora ogni
            verifica seria ha fatto emergere qualcosa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={waLink('Ciao! Ho usato il calcolatore sul sito e avrei bisogno di un parere.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-marker justify-center"
            >
              <MessageCircle className="w-4 h-4" /> Scrivimi su WhatsApp
            </a>
            <button onClick={() => onNavigate('contact')} className="btn-tratto justify-center">
              Tutti i contatti
            </button>
          </div>

          <Righello fitto className="mt-16" />
        </div>
      </section>
    </div>
  );
}
