/**
 * Chi siamo.
 *
 * La versione precedente parlava di un'altra cosa: consulenza sull'acquisto di
 * attrezzatura audio, sopralluoghi, «oltre 500 setup configurati». Erano i
 * testi del progetto da cui questo sito è nato, rimasti in piedi dopo che il
 * sito è diventato un calcolatore per casse acustiche.
 *
 * Qui non si vende niente e non si promette niente: c'è uno strumento, e
 * questa pagina dice come è fatto e come si controlla. Le affermazioni che non
 * potevo verificare sono state tolte invece che riscritte — meglio una pagina
 * più corta di una piena di cose che nessuno ha misurato.
 */

import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { Ruler, ScrollText, AlertTriangle, Github } from 'lucide-react';
import { Annot, Griglia, Righello, Tavola } from '../components/blueprint';
import { GLOSSARY } from '../data/glossary';

const CONTROLLI = [
  {
    titolo: 'Casi limite',
    corpo:
      'Un radiatore passivo senza sospensione deve ridursi a un bass-reflex; con la membrana bloccata, a una cassa chiusa. Un bandpass del sesto ordine col condotto posteriore tappato deve ridursi al quarto. Sono controlli che o tornano o no, e non dipendono da come è scritto il programma.',
    numero: '0,00003 dB',
    nota: 'lo scarto peggiore fra le due strade',
  },
  {
    titolo: 'Ancore note',
    corpo:
      'Il Butterworth del quarto ordine esiste a un solo valore di Qts, cos(3π/8) = 0,38268, e lì il volume deve venire esattamente √2·Vas con accordo pari alla risonanza. È l’unico punto in cui il risultato si conosce in forma chiusa, quindi è l’unico controllo che non ammette opinioni.',
    numero: 'α = √2',
    nota: 'e h = 1, esatti',
  },
  {
    titolo: 'Fonti pubblicate',
    corpo:
      'I valori delle perdite di cassa sono quelli misurati da Small nel 1973, non stime: cassa nuda oltre 100, rivestita 30–80, riempita 7–10. Ogni scheda del glossario dice da dove vengono i suoi numeri, e dove un conto è stato ricavato riporta anche il controllo che lo conferma.',
    numero: 'JAES 1971–76',
    nota: 'Thiele, Small, Keele, Bradbury',
  },
];

const NON_FA = [
  'Non misura. Un calcolatore dice come si comporterà una cassa costruita bene con un driver i cui parametri sono quelli dichiarati: sono due ipotesi, e la seconda è la più fragile.',
  'Non conosce la stanza. La risposta calcolata è in spazio libero; quella che sentirai la decide l’ambiente, che sotto i 200 Hz conta più della cassa.',
  'Non sostituisce il buon senso costruttivo. Un pannello che vibra, una giunzione che perde aria o un condotto che soffia non compaiono in nessuna formula.',
];

export function AboutUs() {
  useSEO({
    title: 'Come è fatto questo calcolatore',
    description:
      'Che cosa calcola, con quali fonti, e come si controlla che i numeri siano giusti. Più quello che un calcolatore non può fare.',
    url: '/chi-siamo',
  });

  return (
    <div className="relative min-h-screen bg-ink text-paper pt-20 pb-24">
      <Griglia />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-14">
          <div className="flex items-baseline gap-3 mb-6">
            <Annot tone="blueprint">Tav. 90</Annot>
            <div className="quota flex-1 max-w-[200px]" aria-hidden />
            <Annot>Metodo</Annot>
          </div>
          <h1 className="titolo text-4xl md:text-6xl mb-6">
            Un calcolatore che <span className="text-marker">si può controllare</span>
          </h1>
          <p className="text-lg text-graphite leading-relaxed max-w-3xl">
            Un programma di calcolo può sbagliare in silenzio per anni: nessuno se ne accorge, perché il
            numero sbagliato ha lo stesso aspetto di quello giusto. L’unico modo per accorgersene è
            controllarlo contro qualcosa che non dipende da lui.
          </p>
        </div>

        {/* ── i tre controlli ── */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {CONTROLLI.map((c, i) => (
            <motion.div
              key={c.titolo}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Tavola className="p-6 h-full flex flex-col">
                <Annot tone="blueprint">{c.titolo}</Annot>
                <p className="mt-4 text-paper/90 leading-relaxed text-[15px] flex-1">{c.corpo}</p>
                <p className="mt-5 font-mono text-2xl text-marker">{c.numero}</p>
                <p className="text-[11px] text-graphite-dim mt-1">{c.nota}</p>
              </Tavola>
            </motion.div>
          ))}
        </div>

        <Righello fitto className="mb-16" />

        {/* ── cosa c'è dentro ── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Ruler className="w-5 h-5 text-marker" strokeWidth={1.5} />
              <h2 className="titolo text-2xl">Cosa calcola</h2>
            </div>
            <ul className="space-y-3 text-graphite leading-relaxed">
              <li>— Sei cariche acustiche: cassa chiusa, bass-reflex, radiatore passivo, bandpass di quarto e sesto ordine, pannello aperto.</li>
              <li>— Volume e accordo dalle forme chiuse degli allineamenti, non da tabelle interpolate.</li>
              <li>— Risposta, escursione, impedenza, fase e ritardo di gruppo dal circuito equivalente: sono grandezze che da una curva di pressione non si ricavano.</li>
              <li>— Condotto, velocità dell’aria, risonanza del tubo, filtro subsonico e limite meccanico di potenza.</li>
              <li>— Dimensioni, lista di taglio, peso, e il materiale fonoassorbente con i suoi tre effetti separati.</li>
              <li>— L’impianto a valle: carico, cavi, assorbimento di rete, reti di compensazione.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-segnale" strokeWidth={1.5} />
              <h2 className="titolo text-2xl">Cosa non fa</h2>
            </div>
            <ul className="space-y-3 text-graphite leading-relaxed">
              {NON_FA.map(t => <li key={t}>— {t}</li>)}
            </ul>
            <p className="mt-6 text-sm text-paper/80 border-l-2 border-segnale/40 pl-5 leading-relaxed">
              Dove i dati del costruttore non chiudono fra loro, il calcolatore lo dice invece di scegliere
              per te quale credere. È il caso più frequente di tutti.
            </p>
          </div>
        </div>

        <Righello fitto className="mb-16" />

        {/* ── il glossario ── */}
        <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start mb-16">
          <ScrollText className="w-8 h-8 text-marker hidden lg:block" strokeWidth={1.2} />
          <div>
            <h2 className="titolo text-2xl mb-4">Niente scatole nere</h2>
            <p className="text-graphite leading-relaxed max-w-3xl">
              Accanto a ogni campo c’è una <span className="text-marker">ⓘ</span> che apre la scheda di quel
              parametro: {GLOSSARY.length} schede, una per grandezza. Ognuna risponde alle stesse quattro
              domande — che cos’è, a cosa serve nel progetto, quali valori aspettarsi, dove si sbaglia di
              solito — e dichiara da dove vengono i suoi numeri. Se un risultato ti sembra strano, la strada
              per capirlo parte da lì.
            </p>
          </div>
        </div>

        {/* ── chi l'ha fatto ── */}
        <Tavola className="p-7 md:p-9">
          <Annot tone="blueprint">Chi l’ha fatto</Annot>
          <div className="grid md:grid-cols-[auto_1fr] gap-7 mt-5 items-start">
            <img
              src="/amerigo_hero.png"
              alt="Amerigo De Cristofaro"
              loading="lazy"
              className="w-28 h-28 object-cover border border-paper/10 grayscale contrast-125"
            />
            <div>
              <p className="text-paper text-lg font-medium mb-1">Amerigo De Cristofaro</p>
              <p className="text-graphite leading-relaxed">
                Officina del Suono è un progetto personale, gratuito e senza pubblicità. Nasce da un sito di
                tutt’altro genere e ne ha tenuto solo il nome: quello che c’era prima non serviva a
                progettare niente.
              </p>
              <p className="text-graphite leading-relaxed mt-4">
                Se trovi un numero che non torna, scrivimi: è la segnalazione più utile che si possa fare a
                uno strumento come questo, e finora ogni verifica seria ne ha fatti emergere.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <a href="mailto:info@officina-del-suono.it" className="btn-marker">Segnala un errore</a>
                <a
                  href="https://github.com/djam3/officinadelsuono"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tratto"
                >
                  <Github className="w-4 h-4" /> Il codice
                </a>
              </div>
            </div>
          </div>
        </Tavola>

      </div>
    </div>
  );
}
