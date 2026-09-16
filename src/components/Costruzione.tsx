/**
 * La cassa che si costruisce mentre si scorre.
 *
 * L'idea è che la pagina iniziale non racconti cosa fa lo strumento ma lo
 * faccia vedere: un disegno tecnico che si compone tratto per tratto, con le
 * quote che compaiono quando il pezzo a cui si riferiscono esiste. Ogni fase
 * porta i numeri veri di quel progetto, non testo di riempimento.
 *
 * COME FUNZIONA. Un contenitore alto cinque schermate, dentro il quale il
 * disegno sta in `position: sticky` e resta fermo mentre il testo gli scorre
 * accanto. La posizione dello scroll diventa un numero fra 0 e 1, e quel
 * numero comanda sia la comparsa dei pezzi sia il tratto che li disegna —
 * `pathLength` su un SVG, che è il modo di far apparire una linea come se
 * fosse tirata con la matita.
 *
 * ACCESSIBILITÀ. Chi ha chiesto meno movimento riceve il disegno già finito e
 * il testo tutto in colonna: l'informazione è la stessa, e non c'è niente che
 * si muova. Non è una versione ridotta, è la stessa pagina senza l'effetto.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';

/** le fasi, nell'ordine in cui un progetto si costruisce davvero */
const FASI = [
  {
    n: '01',
    titolo: 'Il driver',
    testo:
      'Tutto parte da otto numeri stampati su una scheda tecnica. Il calcolatore li controlla uno per uno: fra loro valgono identità esatte, e se due non tornano è inutile andare avanti.',
    quote: [
      { k: 'Fs', v: '35,0 Hz' },
      { k: 'Qts', v: '0,337' },
      { k: 'Vas', v: '75,0 L' },
      { k: 'Sd', v: '510 cm²' },
    ],
  },
  {
    n: '02',
    titolo: 'Il volume',
    testo:
      'Il Qts decide su quale ramo della famiglia si sta. Sotto 0,383 è il quasi-Butterworth: nessuna ondulazione, e il volume esce da una forma chiusa, non da una tabella.',
    quote: [
      { k: 'Allineamento', v: 'QB3' },
      { k: 'α = Vas/Vb', v: '1,740' },
      { k: 'Vb', v: '43,1 L' },
      { k: 'F3', v: '43,2 Hz' },
    ],
  },
  {
    n: '03',
    titolo: 'Il condotto',
    testo:
      'La massa d’aria che risuona con la cassa. Si dimensiona sulla sezione e sulla velocità, e porta con sé una risonanza a canna d’organo che va spostata fuori dalla banda utile.',
    quote: [
      { k: 'Fb', v: '31,4 Hz' },
      { k: 'Lunghezza', v: '66,9 cm' },
      { k: 'Aria', v: '7,7 m/s' },
      { k: 'f_pipe', v: '224 Hz' },
    ],
  },
  {
    n: '04',
    titolo: 'Il materiale',
    testo:
      'Il fonoassorbente fa tre cose insieme: rallenta il suono e fa vedere al cono un volume maggiore, smorza l’accordo, e spegne le onde stazionarie fra le pareti.',
    quote: [
      { k: 'Volume apparente', v: '+11%' },
      { k: 'QA', v: '38' },
      { k: 'QL risultante', v: '8,9' },
      { k: 'Primo modo', v: '268 Hz' },
    ],
  },
  {
    n: '05',
    titolo: 'La risposta',
    testo:
      'E alla fine la curva: non disegnata, calcolata dal circuito equivalente. Da lì escono anche l’escursione del cono, l’impedenza e il ritardo di gruppo — grandezze che da una curva di pressione non si ricavano.',
    quote: [
      { k: 'F3', v: '43,2 Hz' },
      { k: 'F6', v: '35,4 Hz' },
      { k: 'Gobba', v: '0,0 dB' },
      { k: 'SPL max', v: '111 dB' },
    ],
  },
];

/**
 * Due tempi diversi sulla stessa barra di scorrimento.
 *
 * Il DISEGNO si accumula: un pezzo, una volta comparso, resta — è una cassa
 * che si costruisce, non una sequenza di immagini. Il TESTO invece deve entrare
 * e uscire, altrimenti le cinque fasi finiscono una sopra l'altra.
 *
 * Erano la stessa curva, e il risultato era che a scroll zero non si vedeva
 * niente (la prima fase partiva da opacità 0 e ci arrivava solo dopo un decimo
 * della sezione) e alla fine i cinque testi erano tutti accesi insieme.
 */
const PASSO = 1 / FASI.length;

/**
 * Tutti gli intervalli stanno dentro [0, 1], e non è una precauzione.
 *
 * Quando una `useTransform` è agganciata al progresso dello scroll, framer
 * motion passa l'array di INGRESSO direttamente alle API di animazione del
 * browser come offset dei fotogrammi — e quelle pretendono valori fra 0 e 1, in
 * ordine non decrescente. Un −0,03 messo lì per far partire la prima fase
 * "poco prima dell'inizio" non dà un risultato brutto: solleva un'eccezione
 * durante il render, React smonta tutto e la pagina resta bianca.
 *
 * Quindi niente margini fuori scala: la prima fase si fa partire già accesa
 * mettendo 1 in USCITA, non un numero negativo in ingresso.
 */
const dentro = (x: number) => Math.min(Math.max(x, 0), 1);

function useFase(progress: MotionValue<number>, i: number, statico: boolean) {
  const inizio = i * PASSO;
  const fine = (i + 1) * PASSO;
  const primo = i === 0;
  const ultimo = i === FASI.length - 1;

  // il disegno compare e resta: è una cassa che si costruisce, non una sequenza
  const entrata: [number, number] = [dentro(inizio - 0.04), dentro(inizio + PASSO * 0.45)];
  const disegno = useTransform(
    progress,
    statico ? [0, 1] : entrata,
    statico ? [1, 1] : [primo ? 1 : 0, 1],
  );
  const tratto = useTransform(
    progress,
    statico ? [0, 1] : [entrata[0], dentro(inizio + PASSO * 0.55)],
    statico ? [1, 1] : [primo ? 1 : 0, 1],
  );
  // il testo entra, resta, esce: il primo parte acceso, l'ultimo non si spegne
  const testo = useTransform(
    progress,
    statico
      ? [0, 0.33, 0.66, 1]
      : [dentro(inizio - 0.03), dentro(inizio + 0.035), dentro(fine - 0.06), dentro(fine)],
    statico ? [1, 1, 1, 1] : [primo ? 1 : 0, 1, 1, ultimo ? 1 : 0],
  );
  return { disegno, tratto, testo };
}

/**
 * Quanto siamo avanti dentro una sezione alta più di uno schermo, da 0 a 1.
 *
 * Il `useScroll` della libreria qui non agganciava il contenitore giusto e
 * restava fermo a zero — la sezione era pronta, il disegno anche, ma il numero
 * che li comanda non si muoveva. Misurarlo a mano costa dieci righe, non
 * dipende da come la libreria decide di individuare l'elemento che scorre, e si
 * può controllare: è la distanza già percorsa diviso quella percorribile.
 *
 * `rect.top` è negativo quando la sezione è entrata da sopra, e il denominatore
 * è l'altezza della sezione meno una schermata, cioè proprio il tratto in cui
 * il contenuto resta incollato.
 */
function useProgressoSezione(ref: React.RefObject<HTMLElement | null>): MotionValue<number> {
  const progresso = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let atteso = 0;
    const misura = () => {
      atteso = 0;
      const r = el.getBoundingClientRect();
      const corsa = r.height - window.innerHeight;
      progresso.set(corsa > 0 ? Math.min(Math.max(-r.top / corsa, 0), 1) : 0);
    };
    // un fotogramma alla volta: leggere il rect a ogni evento di scroll
    // costerebbe un ricalcolo di layout per ogni tacca della rotellina
    const suScroll = () => {
      if (atteso) return;
      atteso = requestAnimationFrame(misura);
    };
    misura();
    window.addEventListener('scroll', suScroll, { passive: true });
    window.addEventListener('resize', misura);
    return () => {
      if (atteso) cancelAnimationFrame(atteso);
      window.removeEventListener('scroll', suScroll);
      window.removeEventListener('resize', misura);
    };
  }, [ref, progresso]);
  return progresso;
}

export function Costruzione() {
  const ref = useRef<HTMLDivElement>(null);
  const menoMovimento = useReducedMotion() ?? false;
  // Sotto il breakpoint largo la colonna del testo non è sovrapposta ma
  // impilata: lì l'opacità legata allo scroll nasconderebbe pezzi di pagina
  // mentre si scorre. Su schermo stretto la sezione è statica e si legge tutta.
  const [stretto, setStretto] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const agg = () => setStretto(mq.matches);
    agg();
    mq.addEventListener('change', agg);
    return () => mq.removeEventListener('change', agg);
  }, []);
  const statico = menoMovimento || stretto;

  const scrollYProgress = useProgressoSezione(ref);

  const f0 = useFase(scrollYProgress, 0, statico);
  const f1 = useFase(scrollYProgress, 1, statico);
  const f2 = useFase(scrollYProgress, 2, statico);
  const f3 = useFase(scrollYProgress, 3, statico);
  const f4 = useFase(scrollYProgress, 4, statico);
  const fasi = [f0, f1, f2, f3, f4];

  return (
    <section
      ref={ref}
      className="relative border-b border-paper/10"
      style={statico ? undefined : { height: `${FASI.length * 100}vh` }}
    >
      <div className={statico ? 'py-16' : 'sticky top-0 h-screen flex items-center'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">

            {/* ── il disegno ── */}
            <div className={`relative order-2 lg:order-1 ${statico ? 'lg:sticky lg:top-24' : ''}`}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="annot annot-blue">Tav. 01</span>
                <div className="quota flex-1 max-w-[140px]" aria-hidden />
                <span className="annot">Sezione verticale</span>
              </div>
              <Disegno fasi={fasi} />
            </div>

            {/* ── il testo, una fase alla volta ── */}
            <div className={`order-1 lg:order-2 relative ${statico ? '' : 'min-h-[22rem]'}`}>
              {FASI.map((f, i) => (
                <motion.div
                  key={f.n}
                  style={{ opacity: fasi[i].testo }}
                  className={statico ? 'mb-12' : 'absolute inset-0'}
                >
                  <span className="annot annot-marker block mb-3">Fase {f.n}</span>
                  <h3 className="titolo text-3xl md:text-4xl mb-4">{f.titolo}</h3>
                  <p className="text-graphite leading-relaxed mb-6 max-w-lg">{f.testo}</p>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 max-w-sm">
                    {f.quote.map(q => (
                      <div key={q.k} className="flex items-baseline justify-between gap-3 border-b border-paper/[0.08] pb-1.5">
                        <dt className="text-[11px] text-graphite-dim uppercase tracking-wider">{q.k}</dt>
                        <dd className="font-mono text-sm text-marker shrink-0">{q.v}</dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              ))}
            </div>
          </div>

          {/* a che punto della costruzione siamo */}
          {!statico && (
            <div className="mt-10 hidden lg:flex items-center gap-3">
              {FASI.map((f, i) => (
                <motion.div key={f.n} style={{ opacity: fasi[i].disegno }} className="flex items-center gap-2">
                  <span className="annot text-[9px]">{f.n}</span>
                  <div className="h-px w-12 bg-marker" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type Fase = { disegno: MotionValue<number>; tratto: MotionValue<number>; testo: MotionValue<number> };

/**
 * Il disegno vero e proprio.
 *
 * Sezione verticale della cassa vista di lato: pannelli, driver, condotto,
 * fonoassorbente. Le proporzioni sono quelle di una reflex reale, non
 * decorative — 43 litri con un condotto ripiegato occupano davvero quello
 * spazio.
 */
function Disegno({ fasi }: { fasi: Fase[] }) {
  const [driver, volume, condotto, materiale, risposta] = fasi;

  return (
    <svg viewBox="0 0 520 420" className="w-full h-auto" role="img"
      aria-label="Sezione di una cassa acustica che si compone: driver, volume, condotto, materiale assorbente e curva di risposta.">
      {/* griglia di sfondo */}
      <defs>
        <pattern id="mm" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0v16" fill="none" stroke="rgba(220,233,245,0.05)" strokeWidth="1" />
        </pattern>
        <pattern id="lana" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(127,216,245,0.30)" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect width="520" height="420" fill="url(#mm)" />

      {/* ── 02 · il guscio ── */}
      <motion.g style={{ opacity: volume.disegno }}>
        <motion.rect
          x="60" y="40" width="240" height="330" fill="none"
          stroke="#DCE9F5" strokeWidth="2.5"
          style={{ pathLength: volume.tratto }}
        />
        {/* spessore dei pannelli */}
        <rect x="70" y="50" width="220" height="310" fill="none" stroke="rgba(220,233,245,0.35)" strokeWidth="1" />
        {/* quote */}
        <motion.g style={{ opacity: volume.disegno }} stroke="#7FB2D9" strokeWidth="1">
          <line x1="40" y1="40" x2="40" y2="370" />
          <line x1="36" y1="40" x2="44" y2="40" />
          <line x1="36" y1="370" x2="44" y2="370" />
          <text x="26" y="210" fill="#7FB2D9" fontSize="11" fontFamily="monospace"
            transform="rotate(-90 26 210)" textAnchor="middle">641 mm</text>
          <line x1="60" y1="390" x2="300" y2="390" />
          <line x1="60" y1="386" x2="60" y2="394" />
          <line x1="300" y1="386" x2="300" y2="394" />
          <text x="180" y="406" fill="#7FB2D9" fontSize="11" fontFamily="monospace" textAnchor="middle">260 mm</text>
        </motion.g>
      </motion.g>

      {/* ── 04 · il fonoassorbente, sulle pareti ── */}
      <motion.g style={{ opacity: materiale.disegno }}>
        <rect x="70" y="50" width="26" height="310" fill="url(#lana)" />
        <rect x="264" y="50" width="26" height="310" fill="url(#lana)" />
        <rect x="96" y="50" width="168" height="22" fill="url(#lana)" />
      </motion.g>

      {/* ── 01 · il driver ── */}
      <motion.g style={{ opacity: driver.disegno }}>
        {/* cestello visto di lato: cono e magnete */}
        <motion.path
          d="M60 120 L112 104 L112 176 L60 160 Z"
          fill="rgba(127,216,245,0.10)" stroke="#7FD8F5" strokeWidth="2"
          style={{ pathLength: driver.tratto }}
        />
        <rect x="112" y="124" width="30" height="32" fill="rgba(127,216,245,0.18)" stroke="#7FD8F5" strokeWidth="1.5" />
        <line x1="60" y1="118" x2="60" y2="162" stroke="#7FD8F5" strokeWidth="3" />
        <text x="150" y="136" fill="#8EA8C2" fontSize="10" fontFamily="monospace">Sd 510 cm²</text>
        <text x="150" y="150" fill="#8EA8C2" fontSize="10" fontFamily="monospace">Xmax 8 mm</text>
      </motion.g>

      {/* ── 03 · il condotto, ripiegato a L ── */}
      <motion.g style={{ opacity: condotto.disegno }}>
        <motion.path
          d="M60 300 L200 300 L200 340 L60 340"
          fill="none" stroke="#7FD8F5" strokeWidth="2"
          style={{ pathLength: condotto.tratto }}
        />
        <path d="M60 300 L200 300 L200 340 L60 340 Z" fill="rgba(127,216,245,0.07)" />
        {/* frecce dell'aria */}
        <g stroke="#7FB2D9" strokeWidth="1.2" fill="none">
          <path d="M150 320 L120 320 M126 315 L120 320 L126 325" />
          <path d="M100 320 L72 320 M78 315 L72 320 L78 325" />
        </g>
        <text x="212" y="318" fill="#8EA8C2" fontSize="10" fontFamily="monospace">Fb 31,4 Hz</text>
        <text x="212" y="332" fill="#8EA8C2" fontSize="10" fontFamily="monospace">L 66,9 cm</text>
      </motion.g>

      {/* ── 05 · la curva ── */}
      <motion.g style={{ opacity: risposta.disegno }}>
        <line x1="330" y1="330" x2="500" y2="330" stroke="rgba(220,233,245,0.25)" strokeWidth="1" />
        <line x1="330" y1="90" x2="330" y2="330" stroke="rgba(220,233,245,0.25)" strokeWidth="1" />
        {/* linea dei −3 dB */}
        <line x1="330" y1="160" x2="500" y2="160" stroke="rgba(127,178,217,0.5)" strokeWidth="1" strokeDasharray="3 4" />
        <text x="336" y="154" fill="#7FB2D9" fontSize="9" fontFamily="monospace">−3 dB</text>
        <motion.path
          d="M336 300 C352 292 362 250 374 196 C384 156 396 140 414 136 C440 132 470 134 498 134"
          fill="none" stroke="#7FD8F5" strokeWidth="2.5" strokeLinecap="round"
          style={{ pathLength: risposta.tratto }}
        />
        <circle cx="374" cy="160" r="3" fill="#7FD8F5" />
        <text x="352" y="322" fill="#8EA8C2" fontSize="9" fontFamily="monospace">20</text>
        <text x="368" y="322" fill="#7FD8F5" fontSize="9" fontFamily="monospace">43</text>
        <text x="470" y="322" fill="#8EA8C2" fontSize="9" fontFamily="monospace">200 Hz</text>
      </motion.g>
    </svg>
  );
}
