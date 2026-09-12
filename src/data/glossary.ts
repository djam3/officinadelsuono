/**
 * Glossario tecnico: una scheda per ogni parametro del calcolatore.
 *
 * Ogni voce risponde alle stesse quattro domande — che cos'è, a cosa serve nel
 * progetto, quali valori aspettarsi, dove si sbaglia — perché è quello che
 * serve davvero a chi sta compilando il campo e non sa cosa scriverci.
 *
 * Gli `id` coincidono con le chiavi dei parametri nel motore di calcolo, così
 * la ⓘ accanto a ogni campo trova la sua scheda senza tabelle di conversione.
 */

export type GlossaryCategory = 'driver' | 'cassa' | 'condotto' | 'materiali' | 'costruzione';

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  driver: 'Parametri dell’altoparlante',
  cassa: 'Progetto della cassa',
  condotto: 'Condotto reflex',
  materiali: 'Materiali fonoassorbenti',
  costruzione: 'Costruzione',
};

export const CATEGORY_INTRO: Record<GlossaryCategory, string> = {
  driver: 'I parametri Thiele-Small descrivono l’altoparlante come un sistema massa-molla-smorzatore. Sono sovradeterminati: fra loro valgono identità esatte, e se due valori non tornano uno dei due è sbagliato.',
  cassa: 'Dal volume all’accordo: le grandezze che decidono come la cassa carica il cono e dove finisce la risposta in basso.',
  condotto: 'Il condotto non è un buco: è una massa d’aria che risuona con la cedevolezza della cassa. Forma, sezione e lunghezza cambiano l’accordo e il rumore.',
  materiali: 'Il materiale assorbente fa tre cose diverse contemporaneamente, e solo una si vede nel volume.',
  costruzione: 'Spessori, rinforzi e proporzioni: quello che separa un progetto sulla carta da una cassa che suona come previsto.',
};

export interface GlossaryBlock {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
  formula?: { expr: string; caption?: string };
  callout?: { kind: 'attenzione' | 'nota'; text: string };
}

export interface GlossaryEntry {
  id: string;
  symbol: string;
  title: string;
  unit?: string;
  category: GlossaryCategory;
  /** una riga, usata nell’indice e nel tooltip */
  summary: string;
  typical?: { label: string; value: string }[];
  blocks: GlossaryBlock[];
  related?: string[];
  /** da dove vengono i numeri di questa scheda */
  sources?: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  // ─── DRIVER ───────────────────────────────────────────────────────────────
  {
    id: 'fs', symbol: 'Fs', unit: 'Hz', category: 'driver',
    title: 'Frequenza di risonanza in aria libera',
    summary: 'Dove il cono risuona da solo, senza cassa. È il parametro più importante e il più facile da misurare.',
    typical: [
      { label: 'Subwoofer 18"–21"', value: '28–40 Hz' },
      { label: 'Woofer 12"–15"', value: '35–50 Hz' },
      { label: 'Sub car audio', value: '20–35 Hz' },
      { label: 'Midbass 6"–8"', value: '60–90 Hz' },
    ],
    blocks: [
      {
        paragraphs: [
          'La Fs è la frequenza alla quale il cono, appeso alla sua sospensione e senza nessuna cassa attorno, oscilla spontaneamente. È il punto di equilibrio fra due cose che si oppongono: la massa che vuole continuare a muoversi e la molla che vuole riportarla al centro.',
          'Sotto la Fs l’altoparlante smette di comportarsi da pistone e comincia a essere frenato dalla rigidezza della sospensione: l’escursione cresce senza che la pressione emessa aumenti. È il motivo per cui nessuna cassa scende molto sotto la Fs del driver senza pagarlo caro.',
        ],
        formula: { expr: 'Fs = 1 / (2π · √(Cms · Mms))', caption: 'la massa mobile e la cedevolezza la determinano insieme' },
      },
      {
        heading: 'A cosa serve nel progetto',
        paragraphs: [
          'La Fs fissa la scala di tutto il resto. In una cassa chiusa la risonanza sale a Fc = Fs·√(1+α): più piccola è la cassa, più in alto finisce. In un bass-reflex gli allineamenti classici si esprimono come rapporto h = Fb/Fs, quindi l’accordo si sceglie a partire da lei.',
          'Insieme al Qes forma l’EBP (Fs/Qes), l’indice che dice se il driver preferisce una cassa chiusa o un reflex.',
        ],
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'attenzione',
          text: 'Molti costruttori dichiarano la Fs a driver nuovo, con la sospensione ancora dura. Dopo il rodaggio la sospensione si ammorbidisce, la Fs cala e il Vas sale. Se progetti sul dato di targa e misuri dopo il rodaggio troverai numeri diversi: non è un errore del calcolo.',
        },
      },
    ],
    related: ['cms', 'mms', 'vas', 'qes'],
    sources: [
      'Thiele, Loudspeakers in Vented Boxes, JAES 1971',
      'Small, Direct-Radiator Loudspeaker System Analysis, JAES 1972',
    ],
  },
  {
    id: 'qts', symbol: 'Qts', category: 'driver',
    title: 'Fattore di merito totale',
    summary: 'Quanto è smorzato il cono alla risonanza, contando insieme le perdite meccaniche e il freno del motore.',
    typical: [
      { label: 'Pro audio, motore forte', value: '0,17–0,35' },
      { label: 'Uso generale', value: '0,35–0,50' },
      { label: 'Car audio', value: '0,40–0,60' },
      { label: 'Sospensione pneumatica', value: '> 0,55' },
    ],
    blocks: [
      {
        paragraphs: [
          'Il Qts misura quanto poco è smorzata la risonanza: valori bassi significano un cono molto controllato, valori alti un cono che risuona a lungo. Non è una qualità o un difetto, è una vocazione: dice a quale tipo di cassa il driver è adatto.',
          'È il parallelo di due smorzamenti indipendenti. Il Qms viene dalle perdite meccaniche — attrito della sospensione, del ragno, dell’aria. Il Qes viene dal motore: quando il cono si muove, la bobina genera una tensione che si scarica sulla resistenza dell’amplificatore e frena il movimento.',
        ],
        formula: { expr: '1/Qts = 1/Qms + 1/Qes', caption: 'essendo un parallelo, Qts è sempre minore di entrambi' },
      },
      {
        heading: 'A cosa serve nel progetto',
        list: [
          'Qts sotto 0,3: il driver chiede un bass-reflex, o una tromba.',
          'Qts fra 0,3 e 0,5: si presta a entrambe le soluzioni, decide l’EBP.',
          'Qts sopra 0,5: cassa chiusa, o addirittura dipolo. In reflex darebbe una gobba.',
          'Il Butterworth di quarto ordine, l’allineamento reflex più citato, esiste a un solo valore: Qts ≈ 0,383. Con un driver diverso il B4 non è realizzabile e la risposta non sarà massimamente piatta.',
        ],
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'attenzione',
          text: 'Il Qts non si misura: si calcola dagli altri due. Quando i tre numeri non tornano fra loro, il candidato da correggere è lui. E attenzione al vincolo: un Qts maggiore del Qes o del Qms è impossibile, non solo strano.',
        },
      },
    ],
    related: ['qes', 'qms', 'fs', 'alignment'],
    sources: [
      'Small, Vented-Box Loudspeaker Systems Part 1, JAES 1973',
      'Il valore esatto del B4 e cos(3π/8) = 0,3827, verificato sul motore di calcolo',
    ],
  },
  {
    id: 'qes', symbol: 'Qes', category: 'driver',
    title: 'Fattore di merito elettrico',
    summary: 'Quanto il motore frena il cono. Dipende dal campo magnetico, dalla massa e dalla resistenza della bobina.',
    typical: [
      { label: 'Motore forte (pro)', value: '0,20–0,40' },
      { label: 'Uso generale', value: '0,40–0,60' },
    ],
    blocks: [
      {
        paragraphs: [
          'Quando il cono si muove, la bobina attraversa il campo magnetico e genera una tensione contraria. Quella tensione trova una strada chiusa attraverso l’amplificatore e produce una corrente che si oppone al movimento: è un freno, e il Qes ne misura l’efficacia. Più il motore è forte, più il freno è deciso, più il Qes è basso.',
        ],
        formula: { expr: 'Qes = 2π · Fs · Mms · Re / BL²' },
      },
      {
        heading: 'A cosa serve nel progetto',
        paragraphs: [
          'Il Qes governa il rendimento: a parità di Fs e Vas, un Qes più basso significa più decibel per watt. È anche la metà del rapporto EBP = Fs/Qes, il numero che indirizza verso il reflex quando supera 90–100.',
          'Il Qes è l’unico parametro T/S che cambia con l’impianto: se fra amplificatore e altoparlante ci sono cavi sottili o un crossover passivo, la resistenza in serie aumenta e il freno si indebolisce. Un paio di ohm in più possono spostare il Qts abbastanza da cambiare il tipo di cassa che serve.',
        ],
      },
    ],
    related: ['qts', 'bl', 're', 'eta0'],
    sources: [
      'Small, Direct-Radiator Loudspeaker System Analysis, JAES 1972',
    ],
  },
  {
    id: 'qms', symbol: 'Qms', category: 'driver',
    title: 'Fattore di merito meccanico',
    summary: 'Quanto poco attrito ha la parte meccanica: sospensione, ragno, aria attorno al cono.',
    typical: [
      { label: 'Sospensione morbida', value: '5–12' },
      { label: 'Car audio, sospensione rigida', value: '2–5' },
    ],
    blocks: [
      {
        paragraphs: [
          'Il Qms conta solo le perdite meccaniche: l’energia che la sospensione e il ragno dissipano in calore a ogni ciclo, più l’attrito dell’aria. Un Qms alto vuol dire una meccanica efficiente, che restituisce quasi tutta l’energia che riceve.',
          'Rispetto agli altri due Q è il meno influente sul progetto, perché nel parallelo che forma il Qts il termine dominante è quasi sempre il Qes: con Qms 5 e Qes 0,4 il contributo meccanico allo smorzamento totale è circa l’8%.',
        ],
        formula: { expr: 'Qms = 2π · Fs · Mms / Rms' },
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'nota',
          text: 'Proprio perché conta poco, il Qms è anche il parametro peggio verificabile dagli altri: nell’identità dei fattori di merito entra come differenza di reciproci quasi uguali, e con Qts e Qes pubblicati a due decimali l’arrotondamento si amplifica di trenta volte. Per questo il calcolatore, quando non ha il Rms per incrociarlo, preferisce non dargli nessun pallino invece di fingere una verifica.',
        },
      },
    ],
    related: ['qts', 'qes', 'rms'],
    sources: [
      'L’amplificazione ×30 e misurata: sui 32 driver di libreria l’identità letta sul Qts torna entro il 4%, risolta sul Qms arriva al 122%',
    ],
  },
  {
    id: 'vas', symbol: 'Vas', unit: 'litri', category: 'driver',
    title: 'Volume d’aria equivalente',
    summary: 'Il volume d’aria che avrebbe la stessa rigidezza della sospensione. È il modo di misurare la molla in litri.',
    typical: [
      { label: 'Subwoofer 18"', value: '150–300 L' },
      { label: 'Woofer 12"', value: '40–120 L' },
      { label: 'Sub car audio 12"', value: '15–60 L' },
    ],
    blocks: [
      {
        paragraphs: [
          'Il Vas traduce la cedevolezza della sospensione in una grandezza confrontabile con la cassa: è il volume d’aria chiusa che si comporterebbe da molla esattamente come la sospensione del driver. Un Vas grande significa sospensione morbida, un Vas piccolo sospensione rigida.',
          'Serve a rispondere alla domanda pratica: quanto conta la cassa rispetto alla molla che il cono ha già? Il rapporto α = Vas/Vb dice proprio questo. Con α = 1 la cassa raddoppia la rigidezza totale e la risonanza sale del 41%.',
        ],
        formula: { expr: 'Vas = ρ₀ · c² · Sd² · Cms', caption: 'l’area del cono entra al quadrato: un piccolo errore su Sd ne fa uno grande su Vas' },
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'attenzione',
          text: 'Il Vas è il parametro T/S meno ripetibile: varia con il rodaggio, con la temperatura e con l’umidità, e due esemplari dello stesso modello non danno lo stesso numero. Se il progetto è molto sensibile al Vas — cioè se la cassa è piccola rispetto a lui — vale la pena misurarlo sul driver che hai invece di fidarti della scheda.',
        },
      },
    ],
    related: ['cms', 'sd', 'alpha', 'vb'],
    sources: [
      'Small, Closed-Box Loudspeaker Systems Part 1, JAES 1972',
    ],
  },
  {
    id: 'cms', symbol: 'Cms', unit: 'mm/N', category: 'driver',
    title: 'Cedevolezza della sospensione',
    summary: 'Di quanto si sposta il cono per ogni newton di forza. È la molla, misurata direttamente.',
    blocks: [
      {
        paragraphs: [
          'La cedevolezza è l’inverso della rigidezza: un Cms di 0,2 mm/N significa che un newton sposta il cono di due decimi di millimetro. È la stessa grandezza del Vas, espressa in unità meccaniche invece che in litri.',
          'Nel calcolatore il Cms è spesso un valore calcolato più che inserito, e proprio per questo è prezioso: si può ricavare per due strade indipendenti — dal Vas e dall’area del cono, oppure dalla Fs e dalla massa mobile — e se le due strade non danno lo stesso numero il set di parametri è contraddittorio.',
        ],
        formula: { expr: 'Cms = Vas / (ρ₀ · c² · Sd²)   e   Cms = 1 / ((2π·Fs)² · Mms)' },
      },
      {
        heading: 'A cosa serve',
        paragraphs: [
          'Oltre a determinare Fs e Vas, il Cms dichiara quanto il driver è disposto a farsi comprimere dall’aria della cassa. È anche il parametro che cambia di più con il rodaggio e con la temperatura: una sospensione fredda è più rigida, e in inverno un sub può misurare una Fs sensibilmente più alta.',
        ],
      },
    ],
    related: ['vas', 'mms', 'fs', 'sd'],
    sources: [
      'Thiele/Small, relazioni fondamentali',
    ],
  },
  {
    id: 'mms', symbol: 'Mms', unit: 'g', category: 'driver',
    title: 'Massa mobile totale',
    summary: 'Tutto ciò che si muove: cono, bobina, supporto, metà sospensione, più l’aria trascinata.',
    typical: [
      { label: 'Woofer 12"', value: '70–160 g' },
      { label: 'Sub car audio 12"', value: '150–400 g' },
      { label: 'Midbass 8"', value: '20–40 g' },
    ],
    blocks: [
      {
        paragraphs: [
          'La Mms comprende il cono, la bobina, il supporto bobina, la parte mobile di sospensione e ragno, e in più il carico d’aria: lo strato d’aria che il cono si trascina dietro e che partecipa al movimento. Su un cono da 300 mm quel carico vale da solo una ventina di grammi.',
          'La massa e il rendimento sono in conflitto diretto. Una massa alta fa scendere la Fs — utile per un subwoofer — ma peggiora il rendimento, perché la stessa forza produce meno accelerazione. È il motivo per cui i sub profondi hanno sensibilità basse e i driver da tromba hanno coni leggerissimi.',
        ],
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'nota',
          text: 'Alcuni costruttori pubblicano il Mmd invece del Mms: è la stessa massa SENZA il carico d’aria. La differenza è piccola sui driver piccoli e sensibile sui grandi. Se i conti non tornano di un dieci per cento su un 15" o un 18", questa è una causa da controllare.',
        },
      },
    ],
    related: ['cms', 'fs', 'bl', 'eta0'],
    sources: [
      'Il carico d’aria e calcolato come (8/3)·ρ₀·a³ per lato, formulazione classica del pistone in schermo infinito (Beranek)',
    ],
  },
  {
    id: 'rms', symbol: 'Rms', unit: 'kg/s', category: 'driver',
    title: 'Resistenza meccanica',
    summary: 'L’attrito vero della parte mobile, espresso come forza per unità di velocità.',
    blocks: [
      {
        paragraphs: [
          'Il Rms è la forma diretta di ciò che il Qms esprime in forma adimensionale: quanta forza serve per mantenere il cono a una certa velocità, cioè quanta energia la meccanica dissipa. Raramente è pubblicato, e quasi sempre il calcolatore lo ricava dagli altri.',
          'Serve soprattutto come controllo incrociato: se hai Rms, Fs e Mms puoi verificare il Qms per una strada indipendente, cosa che altrimenti non è possibile.',
        ],
        formula: { expr: 'Rms = 2π · Fs · Mms / Qms' },
      },
    ],
    related: ['qms', 'mms', 'fs'],
  },
  {
    id: 'sd', symbol: 'Sd', unit: 'cm²', category: 'driver',
    title: 'Area effettiva del cono',
    summary: 'La superficie che spinge davvero l’aria: cono più circa metà della sospensione, non il diametro del cestello.',
    typical: [
      { label: '8"', value: '~ 210 cm²' },
      { label: '10"', value: '~ 330 cm²' },
      { label: '12"', value: '~ 490 cm²' },
      { label: '15"', value: '~ 810 cm²' },
      { label: '18"', value: '~ 1210 cm²' },
    ],
    blocks: [
      {
        paragraphs: [
          'L’area effettiva non è quella del foro né quella della flangia: si misura sul diametro che va da metà sospensione a metà sospensione, perché la parte esterna del bordo si muove circa la metà del cono e contribuisce solo in parte.',
          'Entra al quadrato in due posti importanti — nel Vas e nel volume spostato — quindi un errore del 10% su Sd diventa un errore del 21% sul Vas.',
        ],
        formula: { expr: 'Sd = π · (diametro effettivo / 2)²' },
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'attenzione',
          text: 'Nel car audio molti costruttori pubblicano come Sd l’area della flangia o quella ricavata dal diametro nominale, che è molto più grande di quella vera: su un 12" si trovano 735 cm² dichiarati contro i ~490 effettivi. In quei casi il Vas pubblicato è coerente con l’area vera, non con quella dichiarata, e conviene ricavare Sd dal Vas.',
        },
      },
    ],
    related: ['dia', 'vas', 'vd', 'cms'],
    sources: [
      'Aree verificate sulle schede tecniche ufficiali B&C, 18 Sound, RCF',
      'I casi di Sd dichiarato come area di flangia sono documentati nelle note della libreria driver',
    ],
  },
  {
    id: 'dia', symbol: 'Dia', unit: 'mm', category: 'driver',
    title: 'Diametro effettivo del cono',
    summary: 'Il diametro che corrisponde all’area effettiva: da metà bordo a metà bordo.',
    blocks: [
      {
        paragraphs: [
          'È l’altra faccia di Sd. Si misura con un metro appoggiato sul driver, prendendo il punto centrale della sospensione da una parte e dall’altra: quello che sta più in fuori si muove troppo poco per contare, quello che sta più in dentro si muove quanto il cono.',
          'Non coincide quasi mai con la misura nominale in pollici: un 12" nominale ha un diametro effettivo attorno ai 250 mm, cioè meno di 10 pollici.',
        ],
      },
    ],
    related: ['sd'],
  },
  {
    id: 'vd', symbol: 'Vd', unit: 'cm³', category: 'driver',
    title: 'Volume spostato',
    summary: 'Quanta aria il cono riesce a muovere restando lineare. È il vero limite di quanto forte può suonare in basso.',
    blocks: [
      {
        paragraphs: [
          'Alle frequenze basse la pressione emessa dipende solo da quanta aria si sposta, non da quanto è grande il cono o da quanto si muove presi separatamente. Il Vd mette insieme le due cose, ed è il numero con cui confrontare driver diversi: un 10" con 15 mm di escursione sposta più aria di un 15" con 4 mm.',
        ],
        formula: { expr: 'Vd = Sd · Xmax' },
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'nota',
          text: 'Alcuni costruttori dichiarano il Vd picco-picco, cioè con l’escursione totale invece che in una sola direzione: viene il doppio. Prima di confrontare due schede tecniche conviene verificare quale convenzione usano.',
        },
      },
    ],
    related: ['sd', 'xmax'],
    sources: [
      'Small, Direct-Radiator Loudspeaker System Analysis, JAES 1972',
    ],
  },
  {
    id: 'xmax', symbol: 'Xmax', unit: 'mm', category: 'driver',
    title: 'Escursione lineare',
    summary: 'Quanto il cono può muoversi in una direzione restando nella parte lineare del motore.',
    blocks: [
      {
        paragraphs: [
          'L’Xmax è la corsa entro la quale la bobina resta immersa nel campo magnetico in modo uniforme, quindi la forza resta proporzionale alla corrente. Oltre quel punto il driver continua a muoversi ma comincia a distorcere, perché parte della bobina esce dal traferro e il BL cala.',
          'La definizione classica è geometrica: metà della differenza fra altezza della bobina e altezza del traferro. Alcuni costruttori usano invece un criterio di distorsione — la corsa a cui il BL scende al 70% — e trovano numeri più generosi. Le due convenzioni non sono confrontabili.',
        ],
      },
      {
        heading: 'A cosa serve nel progetto',
        paragraphs: [
          'È il limite che decide quanta potenza ha senso dare. Nel bass-reflex l’escursione crolla all’accordo, perché lì è il condotto a lavorare, ma sotto l’accordo risale bruscamente: è la ragione per cui un reflex vuole sempre un filtro subsonico.',
        ],
      },
    ],
    related: ['vd', 'xmech', 'pe'],
    sources: [
      'Definizione geometrica classica; il criterio al 70% del BL e quello usato dalla strumentazione Klippel',
    ],
  },
  {
    id: 'xmech', symbol: 'Xmech', unit: 'mm', category: 'driver',
    title: 'Escursione meccanica massima',
    summary: 'Il fondo corsa: oltre quel punto qualcosa si rompe.',
    blocks: [
      {
        paragraphs: [
          'L’Xmech è il limite fisico prima che il ragno vada in tensione, la bobina tocchi il fondo o la sospensione si strappi. Sta sempre sopra l’Xmax, tipicamente fra 1,5 e 2,5 volte.',
          'Nel grafico dell’escursione è la seconda linea rossa: fra Xmax e Xmech il driver suona ancora, ma male; oltre Xmech non suona più affatto.',
        ],
      },
    ],
    related: ['xmax'],
  },
  {
    id: 're', symbol: 'Re', unit: 'Ω', category: 'driver',
    title: 'Resistenza in continua',
    summary: 'La resistenza del filo della bobina, misurabile con un tester. Sta sempre sotto l’impedenza nominale.',
    blocks: [
      {
        paragraphs: [
          'È l’unico parametro T/S che puoi misurare con un tester da dieci euro: due puntali sui morsetti e leggi. Vale tipicamente il 75–90% dell’impedenza nominale — 5,6 Ω su un 8 Ω, 3,2 Ω su un 4 Ω.',
          'Re non è un dettaglio: entra nel Qes, nel BL e soprattutto nel calcolo della potenza. Il rendimento di un altoparlante è definito come potenza acustica su potenza ELETTRICA, cioè V²/Re, non V²/Znominale. Usare l’impedenza nominale al posto di Re significa dichiarare una potenza diversa da quella che sta davvero entrando.',
        ],
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'attenzione',
          text: 'Un Re maggiore dell’impedenza nominale è impossibile: il nominale è il minimo del modulo in banda passante, e il modulo non scende mai sotto la resistenza in continua. Se lo vedi, il valore sbagliato è quasi sempre l’impedenza — succede spesso con le doppie bobine, dove la sigla D2 o D4 indica gli ohm per bobina mentre l’Re tabulato è quello delle due in serie.',
        },
      },
    ],
    related: ['impedance', 'qes', 'bl'],
    sources: [
      'Il rendimento e definito su potenza elettrica V²/Re: verificato confrontando la curva SPL con quella di escursione, due strade indipendenti che tornano entro 0,003 dB',
    ],
  },
  {
    id: 'le', symbol: 'Le', unit: 'mH', category: 'driver',
    title: 'Induttanza della bobina',
    summary: 'Fa salire l’impedenza alle frequenze alte e attenua l’emissione in cima alla banda.',
    blocks: [
      {
        paragraphs: [
          'La bobina è un avvolgimento su un nucleo magnetico, quindi si comporta anche da induttanza. L’effetto è trascurabile in basso e diventa dominante salendo: è la risalita che si vede nella curva di impedenza sopra qualche centinaio di hertz.',
          'Nel modello Thiele-Small classico non compare, perché quel modello vale sotto i 200–300 Hz, dove l’induttanza non conta. Serve invece a disegnare correttamente la curva di impedenza e a capire dove il driver comincia a perdere colpi in alto.',
        ],
      },
      {
        heading: 'Nota di misura',
        callout: {
          kind: 'nota',
          text: 'L’induttanza di un altoparlante non è costante: cala con la frequenza per le correnti parassite nel polo. Per questo molte schede dichiarano Le a 1 kHz (Le1k) invece di un valore generico — sono numeri diversi e non confrontabili.',
        },
      },
    ],
    related: ['re', 'impedance'],
    sources: [
      'Beranek, Acoustics',
    ],
  },
  {
    id: 'impedance', symbol: 'Z', unit: 'Ω', category: 'driver',
    title: 'Impedenza nominale',
    summary: 'L’etichetta commerciale — 2, 4, 8 ohm — che approssima il minimo del modulo in banda.',
    blocks: [
      {
        paragraphs: [
          'L’impedenza di un altoparlante non è un numero ma una curva: parte da Re, sale a un picco alla risonanza, riscende e poi risale per via dell’induttanza. Il valore nominale è una convenzione che approssima il minimo in banda passante, quello che l’amplificatore vede come carico.',
          'Serve a dimensionare l’amplificatore e a collegare più driver. Non serve invece a calcolare la potenza applicata: per quella conta Re.',
        ],
      },
      {
        heading: 'Doppie bobine',
        paragraphs: [
          'Nel car audio le sigle D1, D2, D4 indicano gli ohm di ciascuna delle DUE bobine. Un D2 collegato in serie dà un nominale di 4 Ω, in parallelo 1 Ω, e i parametri T/S pubblicati valgono solo per il collegamento con cui sono stati misurati. Se il costruttore non lo dichiara, lo si capisce dall’Re: se l’Re tabulato è il doppio di quello che ci si aspetta da una bobina sola, la misura è in serie.',
        ],
      },
    ],
    related: ['re', 'le'],
    sources: [
      'Le convenzioni sulle doppie bobine sono verificate sulle pagine ufficiali Sundown, Audison e Hertz',
    ],
  },
  {
    id: 'bl', symbol: 'BL', unit: 'T·m', category: 'driver',
    title: 'Fattore di forza del motore',
    summary: 'Quanti newton di spinta si ottengono per ogni ampere. È la forza del motore, in un numero solo.',
    typical: [
      { label: 'Midbass 8"', value: '8–14 T·m' },
      { label: 'Woofer 12"', value: '12–20 T·m' },
      { label: 'Sub pro 18"–21"', value: '20–32 T·m' },
    ],
    blocks: [
      {
        paragraphs: [
          'Il BL è il prodotto della densità di flusso nel traferro per la lunghezza di filo immersa nel campo. Dice due cose insieme: quanta forza il motore produce per ampere, e quanta tensione genera per metro al secondo di velocità — cioè quanto frena il cono.',
          'È il parametro che comanda il Qes, e quindi indirettamente il rendimento e il tipo di cassa. Un motore forte rende il driver adatto al reflex e alle trombe; un motore debole lo spinge verso la cassa chiusa.',
        ],
        formula: { expr: 'BL = √( 2π · Fs · Mms · Re / Qes )' },
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'nota',
          text: 'Il BL non è costante lungo la corsa: cala man mano che la bobina esce dal traferro, ed è proprio quel calo a definire l’Xmax. Il valore dichiarato è quello a riposo. Capita che il BL di targa e il Qes di targa non tornino fra loro anche su schede ufficiali, perché vengono da misure diverse.',
        },
      },
    ],
    related: ['qes', 'mms', 're'],
    sources: [
      'Small, Direct-Radiator Loudspeaker System Analysis, JAES 1972',
    ],
  },
  {
    id: 'pe', symbol: 'Pe', unit: 'W', category: 'driver',
    title: 'Potenza continua',
    summary: 'Quanta potenza il driver regge senza cuocere. Quasi mai è lei il vero limite.',
    blocks: [
      {
        paragraphs: [
          'La potenza dichiarata è un limite TERMICO: dice quanto calore la bobina riesce a smaltire senza deformare la colla o il supporto. Non dice nulla su quanto forte il driver può suonare.',
          'Nella maggior parte dei progetti in basso il limite che arriva prima è l’escursione: il cono raggiunge l’Xmax molto prima che la bobina si scaldi. Per questo il calcolatore mostra sia il limite di escursione sia quello termico: quello che sta più in basso è il vero tetto del sistema.',
        ],
      },
      {
        heading: 'Nota sulle sigle',
        callout: {
          kind: 'nota',
          text: 'AES, RMS, programma, picco: sono misure diverse con fattori diversi. La AES del pro audio è una misura severa, con rumore rosa filtrato per due ore; il "picco" del car audio spesso è il doppio o il quadruplo della continua e non corrisponde a nessuna prova standard.',
        },
      },
    ],
    related: ['xmax', 're'],
  },
  {
    id: 'eta0', symbol: 'η₀', unit: '%', category: 'driver',
    title: 'Rendimento di riferimento',
    summary: 'La frazione di potenza elettrica che diventa suono. Tipicamente meno dell’1%.',
    blocks: [
      {
        paragraphs: [
          'Un altoparlante è un pessimo trasduttore: di cento watt che entrano, meno di uno esce come suono e il resto diventa calore. Il rendimento di riferimento misura esattamente quella frazione, nella banda dove il driver si comporta da pistone.',
          'La cosa importante è che non si può scegliere. Il rendimento è fissato da tre parametri e da nient’altro: risonanza, volume equivalente e smorzamento elettrico. Non esiste un altoparlante con Fs bassa, Vas piccolo e alto rendimento — è il vincolo che rende impossibili i subwoofer piccoli, profondi ed efficienti tutti insieme.',
        ],
        formula: { expr: 'η₀ = (4π²/c³) · Fs³ · Vas / Qes' },
      },
    ],
    related: ['sensitivity', 'fs', 'vas', 'qes'],
    sources: [
      'Small, Direct-Radiator Loudspeaker System Analysis, JAES 1972 — vincolo rendimento/banda/volume',
    ],
  },
  {
    id: 'sensitivity', symbol: 'Sensibilità', unit: 'dB', category: 'driver',
    title: 'Sensibilità 1 W / 1 m',
    summary: 'Quanti decibel a un metro con un watt in ingresso. È il rendimento espresso in una scala udibile.',
    blocks: [
      {
        paragraphs: [
          'La sensibilità è lo stesso dato del rendimento, riscritto in decibel. Tre decibel in più significano il doppio della potenza acustica a parità di watt: un driver da 96 dB suona quanto uno da 90 dB con un quarto dell’amplificazione.',
        ],
        formula: { expr: 'Sensibilità = 112,16 + 10·log₁₀(η₀)', caption: 'la costante vale 112,16 dB, non 112 tondo: la differenza sposta le curve di 0,16 dB' },
      },
      {
        heading: 'Dove si sbaglia',
        callout: {
          kind: 'attenzione',
          text: 'Le sensibilità dichiarate sono quasi sempre un po’ ottimistiche: confrontandole con il rendimento teorico su una trentina di driver da schede ufficiali lo scarto medio è di circa +0,9 dB. Uno scarto di un paio di decibel è normale; uno di dieci significa che uno dei parametri è sbagliato, perché la sensibilità non è un numero libero.',
        },
      },
    ],
    related: ['eta0', 'fs', 'vas', 'qes'],
    sources: [
      'La costante 112,16 dB viene da 20·log₁₀(√(ρ₀c/2π)/20µPa)',
      'Lo scarto medio +0,9 dB e misurato sui 32 driver di libreria presi da schede ufficiali (deviazione standard 1,12 dB)',
    ],
  },

  // ─── CASSA ────────────────────────────────────────────────────────────────
  {
    id: 'vb', symbol: 'Vb', unit: 'litri', category: 'cassa',
    title: 'Volume netto della cassa',
    summary: 'L’aria effettivamente disponibile dentro il mobile, al netto di tutto ciò che la occupa.',
    blocks: [
      {
        paragraphs: [
          'Il volume che conta acusticamente non è quello geometrico interno: bisogna sottrarre l’ingombro del cestello e del magnete, il volume del condotto, i rinforzi interni e la parte solida del materiale assorbente. Su una cassa da 50 litri lordi si arriva facilmente a 44–45 netti.',
          'Il volume è la molla d’aria che si somma a quella della sospensione. Più è piccolo, più la molla totale è rigida, più la risonanza sale e la risposta si accorcia in basso.',
        ],
      },
      {
        heading: 'Nota',
        callout: {
          kind: 'nota',
          text: 'Il materiale assorbente fa un gioco al contrario: occupa un po’ di volume ma ne fa "vedere" di più al woofer, perché rallenta la compressione dell’aria. Il bilancio è quasi sempre positivo.',
        },
      },
    ],
    related: ['alpha', 'qtc', 'absorber'],
  },
  {
    id: 'alpha', symbol: 'α', category: 'cassa',
    title: 'Rapporto di compliance',
    summary: 'Quante volte la cassa è più rigida della sospensione del driver: α = Vas / Vb.',
    blocks: [
      {
        paragraphs: [
          'L’alfa è il numero che riassume il rapporto di forze fra il driver e la sua cassa. Con α = 1 la cassa contribuisce quanto la sospensione e la risonanza sale del 41%; con α = 3 la cassa domina e la risonanza raddoppia.',
          'È il parametro con cui sono tabulati tutti gli allineamenti classici, insieme al rapporto h = Fb/Fs.',
        ],
        formula: { expr: 'Fc = Fs · √(1 + α)     Qtc = Qts · √(1 + α)' },
      },
    ],
    related: ['vas', 'vb', 'qtc', 'alignment'],
    sources: [
      'Small, Closed-Box Loudspeaker Systems Part 1, JAES 1972',
    ],
  },
  {
    id: 'qtc', symbol: 'Qtc', category: 'cassa',
    title: 'Fattore di merito del sistema chiuso',
    summary: 'Lo smorzamento del driver una volta chiuso in cassa. Decide il carattere del basso.',
    typical: [
      { label: 'Massimamente piatto', value: '0,707' },
      { label: 'Basso asciutto e controllato', value: '0,5–0,7' },
      { label: 'Basso pieno, un po’ gonfio', value: '0,8–1,0' },
      { label: 'Troppo piccola', value: '> 1,1' },
    ],
    blocks: [
      {
        paragraphs: [
          'Il Qtc è il Qts del driver moltiplicato per l’effetto della cassa. Sotto 0,707 la risposta scende dolcemente e senza gobbe ma perde estensione; sopra 0,707 compare un picco prima della discesa, che dà l’impressione di più basso ma è meno controllato.',
          'A Qtc esattamente 0,707 — l’allineamento Butterworth di secondo ordine — succede una cosa comoda: la frequenza di taglio a −3 dB coincide esattamente con la risonanza in cassa. È il caso più usato come punto di partenza.',
        ],
        formula: { expr: '1/Qtc = 1/Qec + 1/Qmc + 1/Qa', caption: 'con il materiale assorbente le perdite della cassa entrano in parallelo e abbassano il Qtc' },
      },
    ],
    related: ['alpha', 'f3', 'qa', 'vb'],
    sources: [
      'Small, Closed-Box Loudspeaker Systems Part 1, JAES 1972',
      'L’identità F3 = Fc a Qtc 0,707 e verificata sul motore',
    ],
  },
  {
    id: 'fb', symbol: 'Fb', unit: 'Hz', category: 'cassa',
    title: 'Frequenza di accordo',
    summary: 'Dove il condotto — o il radiatore passivo — risuona con l’aria della cassa.',
    blocks: [
      {
        paragraphs: [
          'In un bass-reflex la massa d’aria del condotto e la cedevolezza dell’aria in cassa formano un risonatore di Helmholtz. All’accordo il condotto irradia il massimo e il cono si ferma quasi del tutto: è il motivo per cui un reflex regge più potenza di una cassa chiusa proprio dove serve.',
          'Sotto l’accordo il condotto smette di caricare il cono e comincia a lavorare in opposizione: l’escursione risale bruscamente e la risposta crolla a 24 dB per ottava. È lì che serve il filtro subsonico.',
        ],
        formula: { expr: 'Fb = (c / 2π) · √( Av / (Vb · Leff) )', caption: 'Av area del condotto, Leff lunghezza più le correzioni terminali' },
      },
    ],
    related: ['vb', 'portlength', 'f3', 'alignment'],
    sources: [
      'Thiele, Loudspeakers in Vented Boxes, JAES 1971',
    ],
  },
  {
    id: 'f3', symbol: 'F3', unit: 'Hz', category: 'cassa',
    title: 'Frequenza di taglio a −3 dB',
    summary: 'Dove la risposta è scesa di 3 decibel rispetto alla banda passante. Il modo convenzionale di dire "fin dove scende".',
    blocks: [
      {
        paragraphs: [
          'La F3 è un indicatore comodo ma va letto con attenzione, perché dipende dal riferimento. Qui è misurata rispetto all’asintoto di banda passante, come nella convenzione di Small: se la risposta ha una gobba, il punto a −3 dB sotto il PICCO è un altro numero.',
          'Non dice tutto: due casse con la stessa F3 possono suonare molto diverse, perché una scende a 12 dB per ottava e l’altra a 24. Un reflex con F3 più bassa di una cassa chiusa può avere meno uscita reale a 20 Hz.',
        ],
      },
      {
        heading: 'Come la calcola questo strumento',
        paragraphs: [
          'Non da una formula approssimata ma leggendola sulla curva effettivamente calcolata, interpolando fra i due campioni che attraversano la soglia. Così il numero dichiarato coincide sempre con il grafico, qualunque sia il tipo di cassa e l’allineamento.',
        ],
      },
    ],
    related: ['qtc', 'fb', 'alignment'],
    sources: [
      'Convenzione di Small, la stessa usata da BassBox e WinISD',
    ],
  },
  {
    id: 'alignment', symbol: 'Allineamento', category: 'cassa',
    title: 'Allineamento del bass-reflex',
    summary: 'La ricetta che lega volume e accordo per ottenere una certa forma di risposta.',
    blocks: [
      {
        paragraphs: [
          'Un bass-reflex ha due gradi di libertà — quanto grande e quanto accordato — e ogni combinazione dà una forma diversa. Gli allineamenti sono le combinazioni che producono forme note e utili, tabulate in funzione del Qts del driver.',
        ],
        list: [
          'B4 (Butterworth): risposta massimamente piatta, la più citata. Esiste a un solo valore di Qts, circa 0,383: con un driver diverso non è realizzabile.',
          'QB3 (quasi-Butterworth): per driver con Qts più basso. Cassa più piccola del B4 a parità di driver, discesa un filo più dolce.',
          'C4 (Chebyshev): accetta una piccola ondulazione in banda in cambio di più estensione. Per Qts più alti.',
          'SBB4 (Super Boom Box): cassa più grande, accordo più basso, risposta molto smorzata.',
          'Bessel: fase più lineare e ritardo di gruppo migliore, a costo di estensione.',
        ],
      },
      {
        heading: 'Nota',
        callout: {
          kind: 'nota',
          text: 'Gli allineamenti classici presuppongono una cassa senza perdite, o con perdite standard (QL = 7). Cambiando il materiale assorbente cambiano le perdite reali, e con esse la forma che si ottiene davvero.',
        },
      },
    ],
    related: ['qts', 'fb', 'vb', 'ql'],
    sources: [
      'Thiele 1971 (tabelle originali), Small 1973, Keele 1973, Bullock 1981',
    ],
  },
  {
    id: 'ql', symbol: 'QL / QB', category: 'cassa',
    title: 'Perdite della cassa',
    summary: 'Quanta energia la cassa dissipa invece di restituirla. Ammorbidisce la risposta attorno all’accordo.',
    typical: [
      { label: 'Cassa molto ben fatta', value: 'QB 10–15' },
      { label: 'Costruzione normale', value: 'QB 5–10' },
      { label: 'Cassa molto imbottita', value: 'QB 3–5' },
    ],
    blocks: [
      {
        paragraphs: [
          'Le perdite di una cassa hanno tre origini: le fughe d’aria dalle giunzioni e dalla guarnizione del driver, l’assorbimento del materiale interno, e l’attrito nel condotto. Small ha mostrato che nei valori che si misurano davvero le tre hanno un effetto indistinguibile l’una dall’altra, quindi si possono riassumere in un solo numero.',
          'Le perdite non sono un difetto da eliminare: smussano il picco di risposta all’accordo e rendono il progetto meno sensibile agli errori di costruzione. Ma se scendono troppo mangiano estensione: sotto QB 4 la F3 si alza visibilmente.',
        ],
      },
      {
        heading: 'Valori misurati',
        list: [
          'Fughe: sono le dominanti, QL fra 5 e 20 anche su casse apparentemente perfette.',
          'Assorbimento: cassa nuda oltre 100, rivestimento tipico 30–80, riempita 7–10.',
          'Condotto libero: 50–100, molto meno se ostruito da tessuto o materiale.',
        ],
      },
    ],
    related: ['qa', 'absorber', 'alignment'],
    sources: [
      'Small, Vented-Box Loudspeaker Systems Part 1, JAES 1973: fughe 5–20, assorbimento ≥100 a cassa nuda e 30–80 rivestita, condotto libero 50–100',
    ],
  },

  // ─── CONDOTTO ─────────────────────────────────────────────────────────────
  {
    id: 'porttype', symbol: 'Tipo di condotto', category: 'condotto',
    title: 'Geometria del condotto',
    summary: 'Tubo, slot, angolo, ripiegato: la forma cambia l’accordo a parità di misure.',
    blocks: [
      {
        paragraphs: [
          'Un condotto accorda in base alla massa d’aria che contiene, e quella massa non finisce alle sue estremità: l’aria appena fuori dalla bocca partecipa al movimento. La correzione terminale tiene conto di questo, e dipende da come è fatta ogni bocca.',
          'Una bocca a filo di un pannello largo "vede" più aria di una libera in mezzo al nulla, quindi pesa di più e abbassa l’accordo. Per questo lo stesso tubo, montato diversamente, accorda a frequenze diverse.',
        ],
        list: [
          'Tubo con entrambe le bocche libere: correzione 0,614 diametri.',
          'Tubo a filo del pannello: 0,732.',
          'Tubo con doppia flangia o svasato: 0,850.',
          'Slot rettangolare: 0,732; con una parete condivisa 0,830; d’angolo con due pareti 0,850.',
          'Ripiegati a L o a U: come lo slot, ma le pieghe accorciano leggermente il percorso utile perché il flusso taglia l’angolo.',
        ],
      },
      {
        heading: 'Perché la forma conta anche per il rumore',
        paragraphs: [
          'Le geometrie svasate tollerano velocità dell’aria più alte prima di fischiare — fino a 25 m/s contro i 17 di un tubo dritto — perché il raccordo evita che il flusso si stacchi dalle pareti alla bocca.',
        ],
      },
    ],
    related: ['portlength', 'ventvelocity', 'fb'],
    sources: [
      'Le correzioni terminali si compongono dalle due bocche: 0,425 a filo di pannello e 0,307 libera',
    ],
  },
  {
    id: 'portlength', symbol: 'Lunghezza condotto', unit: 'mm', category: 'condotto',
    title: 'Lunghezza del condotto',
    summary: 'Insieme alla sezione decide l’accordo. Più lungo accorda più in basso.',
    blocks: [
      {
        paragraphs: [
          'La lunghezza necessaria cresce con il quadrato della sezione e cala con il quadrato della frequenza: raddoppiare il diametro di un tubo richiede quattro volte la lunghezza per lo stesso accordo. È il compromesso centrale del bass-reflex, perché una sezione grande serve a non far soffiare il condotto ma porta a lunghezze che non entrano nella cassa.',
        ],
        formula: { expr: 'L = (c²/4π²) · Av / (Fb² · Vb) − k · Dv', caption: 'il secondo termine è la correzione terminale, che dipende dalla geometria' },
      },
      {
        heading: 'Quando non ci sta',
        callout: {
          kind: 'attenzione',
          text: 'Se il condotto risulta più lungo della profondità disponibile ci sono tre strade: ripiegarlo a L o a U, allargare la sezione accettando una lunghezza maggiore ma una velocità minore, oppure passare a un radiatore passivo, che accorda senza occupare lunghezza.',
        },
      },
    ],
    related: ['fb', 'porttype', 'ventvelocity'],
    sources: [
      'Formula di Helmholtz con correzione terminale',
    ],
  },
  {
    id: 'ventvelocity', symbol: 'Velocità in porta', unit: 'm/s', category: 'condotto',
    title: 'Velocità dell’aria nel condotto',
    summary: 'Se supera il limite, il condotto smette di accordare e comincia a soffiare.',
    blocks: [
      {
        paragraphs: [
          'Quando l’aria nel condotto viaggia troppo veloce il flusso diventa turbolento: si sente un soffio, l’accordo si sposta e compaiono armoniche che non c’erano nel segnale. Il limite dipende dalla geometria — circa 17 m/s per un tubo dritto, 20 per uno slot, 25 per uno svasato.',
          'La velocità massima si raggiunge attorno all’accordo, dove il condotto fa tutto il lavoro, e cresce con la radice della potenza. Un progetto che va bene a 100 W può soffiare a 400.',
        ],
      },
      {
        heading: 'Il criterio di Small',
        paragraphs: [
          'Esiste una regola di dimensionamento minimo che lega la sezione del condotto all’accordo e al volume spostato dal driver. Se la sezione scelta sta sotto quel minimo, il condotto soffierà prima che il cono arrivi al suo limite: il collo di bottiglia diventa il condotto invece dell’altoparlante.',
        ],
      },
    ],
    related: ['portlength', 'porttype', 'xmax'],
    sources: [
      'Criterio di dimensionamento minimo di Small; le soglie di velocità per geometria sono valori di pratica costruttiva, non una norma',
    ],
  },

  // ─── RADIATORE PASSIVO ────────────────────────────────────────────────────
  {
    id: 'prvas', symbol: 'Vas del radiatore', unit: 'litri', category: 'cassa',
    title: 'Cedevolezza del radiatore passivo',
    summary: 'La molla della membrana passiva, espressa in litri. Decide dove cade il notch.',
    blocks: [
      {
        paragraphs: [
          'Un radiatore passivo non è un condotto. Il condotto è una massa d’aria pura; il radiatore è una massa CON la propria sospensione, e quella molla in più cambia la fisica del sistema: alla frequenza in cui la membrana risuona da sola, la sua uscita si annulla e nella risposta compare un notch.',
          'Più la membrana è cedevole — Vas grande — più il notch scende in basso e meno disturba. Un radiatore rigido porta il notch dentro la banda utile.',
        ],
        formula: { expr: 'fp = Fb · √( Vb / (Vb + Vap) )', caption: 'la frequenza del notch dipende solo dai due volumi' },
      },
      {
        heading: 'Sotto il notch',
        paragraphs: [
          'Al di sotto della sua risonanza la membrana si irrigidisce e smette di muoversi: la cassa torna a comportarsi da chiusa e la pendenza torna a 12 dB per ottava, invece dei 24 di un reflex. È la differenza che si vede nei grafici fra un radiatore passivo e un condotto.',
        ],
      },
    ],
    related: ['prmass', 'prxmax', 'fb'],
    sources: [
      'Small, Passive-Radiator Loudspeaker Systems Part 1, JAES 1974',
      'La posizione del notch e verificata sul circuito equivalente entro lo 0,4–0,7%',
    ],
  },
  {
    id: 'prmass', symbol: 'Massa del radiatore', unit: 'g', category: 'cassa',
    title: 'Massa mobile del radiatore passivo',
    summary: 'È lei ad accordare il sistema, come la lunghezza fa per un condotto.',
    blocks: [
      {
        paragraphs: [
          'In un radiatore passivo l’accordo non si regola con la lunghezza ma con il peso: si aggiungono dischi di zavorra alla membrana finché la risonanza scende dove serve. È il motivo per cui un radiatore permette accordi molto bassi in casse poco profonde, dove un condotto non ci starebbe.',
        ],
      },
      {
        heading: 'Attenzione al valore',
        callout: {
          kind: 'attenzione',
          text: 'Il numero che il calcolatore indica è la massa mobile TOTALE che il radiatore deve avere. La zavorra da aggiungere è la differenza rispetto a quanto pesa già la membrana che hai scelto, dato che il costruttore dichiara.',
        },
      },
    ],
    related: ['prvas', 'fb'],
    sources: [
      'Small, Passive-Radiator Loudspeaker Systems Part 1, JAES 1974',
    ],
  },
  {
    id: 'prxmax', symbol: 'Xmax del radiatore', unit: 'mm', category: 'cassa',
    title: 'Escursione del radiatore passivo',
    summary: 'La membrana si muove molto più del cono. Se va in fondo corsa per prima, limita tutto il sistema.',
    blocks: [
      {
        paragraphs: [
          'All’accordo il driver è quasi fermo ed è la membrana passiva a irradiare: in quel punto la sua escursione è parecchie volte quella del cono. Per questo la regola classica dice che un radiatore deve avere un volume spostabile almeno DOPPIO rispetto a quello del driver.',
          'Il calcolatore non ripete la regola: calcola quanto la membrana percorre davvero quando il driver arriva al suo Xmax, così puoi confrontarlo con l’Xmax del radiatore che stai valutando.',
        ],
      },
      {
        heading: 'Se non basta',
        paragraphs: [
          'Le soluzioni sono due: scegliere un radiatore con più corsa, oppure metterne due. Due membrane condividono il lavoro e ciascuna percorre la metà, ma la massa totale da ripartire cambia e va ricalcolata.',
        ],
      },
    ],
    related: ['prvas', 'prmass', 'xmax'],
    sources: [
      'Small raccomanda un volume spostabile almeno doppio di quello del driver; sul modello circuitale il rapporto calcolato risulta 2,3',
    ],
  },

  // ─── MATERIALI ────────────────────────────────────────────────────────────
  {
    id: 'absorber', symbol: 'Materiale assorbente', category: 'materiali',
    title: 'Materiale fonoassorbente',
    summary: 'Fa tre cose insieme: allarga il volume apparente, smorza la cassa, e uccide le onde stazionarie interne.',
    blocks: [
      {
        heading: 'Uno: il volume apparente',
        paragraphs: [
          'Le fibre scambiano calore con l’aria, e la compressione passa da adiabatica a isotermica. La velocità del suono nella cassa scende e il woofer "vede" un volume maggiore di quello reale. Il limite non è convenzionale ma esatto: γ − 1, cioè il 40,2%. In pratica si misurano incrementi del 20–30% nei riempimenti spinti.',
        ],
      },
      {
        heading: 'Due: lo smorzamento',
        paragraphs: [
          'Il materiale dissipa energia, quindi abbassa il Qa della cassa. In una cassa chiusa questo si somma allo smorzamento del driver e abbassa il Qtc; in un bass-reflex smussa il picco attorno all’accordo. Oltre una certa densità però il materiale smette di assorbire e comincia a riflettere: l’aria non lo attraversa più e si comporta da parete.',
        ],
      },
      {
        heading: 'Tre: le onde stazionarie',
        paragraphs: [
          'Fra ogni coppia di pareti parallele si forma una risonanza di cavità a f = c/(2d). Su una cassa da 60 cm di altezza la prima cade attorno ai 280 Hz, dentro la banda di molti woofer, e si sente come una colorazione. Il materiale la abbatte, tanto più efficacemente quanto più è spesso rispetto alla lunghezza d’onda.',
        ],
      },
      {
        heading: 'Quale scegliere',
        list: [
          'Fibra di poliestere / Dacron: la più usata, per il riempimento uniforme. Non rilascia polveri e non si compatta.',
          'Poliuretano bugnato: per rivestire le pareti. Ottimo alle medie, poco efficace sul volume apparente.',
          'Feltro o lana pressata: lavora più come massa smorzante sul pannello che come assorbitore.',
          'Lana di roccia o di vetro: assorbe di più a parità di densità, ma NON va usata nelle casse con condotto, perché le fibre migrano nel flusso d’aria e vengono espulse dal reflex.',
        ],
      },
    ],
    related: ['qa', 'vb', 'placement'],
    sources: [
      'Il limite γ−1 = 40,2% e esatto; gli incrementi misurati del 20–30% sono di letteratura (limite pratico ~20% in Weems)',
      'Bradbury, The Use of Fibrous Materials in Loudspeaker Enclosures, JAES 1976',
      'Small, Vented-Box Part 1, JAES 1973 per i valori di Qa',
    ],
  },
  {
    id: 'placement', symbol: 'Posizionamento', category: 'materiali',
    title: 'Rivestimento o riempimento',
    summary: 'Dove metti il materiale conta quanto quale materiale usi.',
    blocks: [
      {
        paragraphs: [
          'Il rivestimento copre solo le pareti e lascia libero il centro della cassa: smorza le riflessioni interne ma incide poco sul volume apparente, perché la maggior parte dell’aria resta lontana dalle fibre. È la scelta normale per i bass-reflex, dove riempire tutto interferirebbe con il condotto.',
          'Il riempimento uniforme mette il materiale ovunque: massimizza sia l’effetto di volume sia lo smorzamento. È la scelta tipica delle casse chiuse.',
        ],
      },
      {
        heading: 'Nota sul volume della cassa',
        callout: {
          kind: 'nota',
          text: 'A parità di spessore, un rivestimento occupa una frazione molto maggiore di una cassa piccola che di una grande: 30 mm in una cassa da 10 litri sono proporzionalmente molto più materiale che in una da 100, e l’effetto è diverso. Per questo il calcolatore ricava la frazione dalla geometria vera invece di usare una percentuale fissa.',
        },
      },
    ],
    related: ['absorber', 'qa'],
    sources: [
      'Small osserva che il rivestimento sulle pareti, dove la velocità particellare e bassa, estrae poca energia',
    ],
  },
  {
    id: 'qa', symbol: 'Qa', category: 'materiali',
    title: 'Perdite per assorbimento',
    summary: 'Quanta energia il materiale toglie al sistema. Più è basso, più smorza.',
    typical: [
      { label: 'Cassa nuda', value: '100 o più' },
      { label: 'Rivestimento tipico', value: '30–80' },
      { label: 'Cassa riempita', value: '7–10' },
      { label: 'Riempimento molto denso', value: '3–5' },
    ],
    blocks: [
      {
        paragraphs: [
          'Il Qa misura le perdite dovute all’assorbimento, separate da quelle per fuga e da quelle del condotto. Il parametro fisico che lo comanda è la resistenza al flusso del materiale: quanta pressione serve per far passare aria attraverso uno spessore dato.',
          'Nella cassa chiusa il Qa entra direttamente nel Qtc, in parallelo agli altri due smorzamenti. Nel bass-reflex invece non va messo nel Qts, perché la funzione di trasferimento di quarto ordine porta già le perdite nei suoi coefficienti: lì si combina con fughe e condotto in un unico QB.',
        ],
      },
    ],
    related: ['absorber', 'ql', 'qtc'],
    sources: [
      'Small, Vented-Box Loudspeaker Systems Part 1, JAES 1973',
      'La resistività al flusso in funzione della densità: Garai-Pompoli 2005 per il poliestere, Bies-Hansen 1980 per le lane minerali',
    ],
  },

  // ─── COSTRUZIONE ──────────────────────────────────────────────────────────
  {
    id: 'wallthickness', symbol: 'Spessore pannelli', unit: 'mm', category: 'costruzione',
    title: 'Spessore dei pannelli',
    summary: 'Un pannello che vibra irradia suono che non hai chiesto, e in ritardo.',
    blocks: [
      {
        paragraphs: [
          'La pressione dentro una cassa fa flettere le pareti, che diventano loro stesse altoparlanti — con risonanze proprie, tempi di decadimento lunghi e nessun controllo. Lo spessore è la prima difesa, ma non l’unica: la rigidezza cresce con il cubo dello spessore, mentre l’area del pannello conta molto di più.',
          'Il MDF da 18 mm è lo standard per casse di media taglia; sopra i 60–80 litri o con potenze elevate conviene salire a 22–25, oppure restare a 18 e aggiungere rinforzi, che rendono molto di più a parità di peso.',
        ],
      },
      {
        heading: 'Materiali',
        list: [
          'MDF: denso, uniforme, economico, facile da lavorare. Teme l’umidità.',
          'Betulla baltica multistrato: più rigida a parità di spessore e molto più leggera, ma costosa e più difficile da rifinire.',
          'Truciolare: da evitare, poco omogeneo e con tenuta delle viti scarsa.',
        ],
      },
    ],
    related: ['bracing', 'weight'],
    sources: [
      'La rigidezza flessionale di una piastra cresce con il cubo dello spessore',
    ],
  },
  {
    id: 'bracing', symbol: 'Rinforzi', unit: '%', category: 'costruzione',
    title: 'Rinforzi interni',
    summary: 'Traverse e pannelli forati che spezzano le campate e alzano la frequenza di risonanza dei pannelli.',
    blocks: [
      {
        paragraphs: [
          'Un rinforzo non irrigidisce il pannello: lo divide in campate più piccole. Una traversa a metà di una parete dimezza la luce, e la frequenza di risonanza sale di quattro volte — abbastanza da portarla fuori dalla banda di lavoro, dove nessuno la eccita più.',
          'Il modo più efficace è collegare le pareti opposte fra loro, così la pressione interna le spinge l’una contro l’altra invece di farle flettere. I pannelli forati a nido d’ape fanno questo su tutta la sezione.',
        ],
      },
      {
        heading: 'Nel calcolo',
        paragraphs: [
          'I rinforzi occupano volume: la percentuale indicata viene sottratta dal lordo interno per arrivare al netto acustico. Il 3% è una stima ragionevole per una cassa normalmente rinforzata.',
        ],
      },
    ],
    related: ['wallthickness', 'vb'],
    sources: [
      'Per una campata la frequenza di risonanza va come 1/L²: dimezzare la luce la moltiplica per quattro',
    ],
  },
  {
    id: 'ratio', symbol: 'Proporzioni', category: 'costruzione',
    title: 'Proporzioni interne',
    summary: 'Larghezza, altezza e profondità diverse fra loro, per non sovrapporre le risonanze.',
    blocks: [
      {
        paragraphs: [
          'Ogni coppia di pareti parallele genera la sua risonanza a c/(2d). Se due dimensioni sono uguali, o una è il doppio dell’altra, due risonanze cadono sulla stessa frequenza e si sommano: quella colorazione diventa molto più udibile.',
          'La proporzione aurea 1 : 1,618 : 0,618 è la scelta classica perché distribuisce le risonanze nel modo più irregolare possibile. Non è magia: qualunque terna di rapporti irrazionali e ben distanziati funziona altrettanto bene.',
        ],
      },
      {
        heading: 'Forme alternative',
        list: [
          'Trapezoidale: le pareti non parallele spostano le risonanze e le rendono meno definite. Più complicata da costruire.',
          'Cilindrica: elimina due coppie di pareti parallele e ha una rigidezza intrinseca altissima, ma introduce risonanze radiali.',
        ],
      },
    ],
    related: ['absorber', 'wallthickness'],
    sources: [
      'Le risonanze di cavità stanno a f = n·c/(2d) per ogni coppia di pareti parallele',
    ],
  },
  {
    id: 'mountingdepth', symbol: 'Profondità di montaggio', unit: 'mm', category: 'costruzione',
    title: 'Ingombro del driver',
    summary: 'Cestello e magnete occupano volume dentro la cassa, e va sottratto.',
    blocks: [
      {
        paragraphs: [
          'La profondità di montaggio è la quota dal piano della flangia al punto più arretrato del magnete. Serve a due cose: verificare che il driver ci stia nella cassa, e stimare quanto volume sottrae.',
          'Il cestello non è un cilindro pieno: fra le razze passa aria, e l’ingombro effettivo è circa un terzo del volume del cono di ingombro. Su un 15" di media potenza si parla di uno o due litri, che su una cassa da 50 non sono trascurabili.',
        ],
      },
      {
        heading: 'Configurazioni multiple',
        callout: {
          kind: 'nota',
          text: 'Conta il numero di driver FISICI, non quello dei coni che irradiano. In una configurazione isobarica i cestelli dentro la cassa sono due per ogni cono utile, e occupano volume entrambi.',
        },
      },
    ],
    related: ['vb', 'sd'],
    sources: [
      'Il 35% del volume del cono di ingombro e una stima di questo strumento, non un dato di targa',
    ],
  },

  // ─── ALTRO ────────────────────────────────────────────────────────────────
  {
    id: 'bandpass', symbol: 'Rapporto camere', category: 'cassa',
    title: 'Bandpass: rapporto fra le camere',
    summary: 'Decide il baratto centrale del bandpass: quanto stretta la banda, quanti decibel in più dentro.',
    blocks: [
      {
        paragraphs: [
          'In un bandpass il driver è chiuso fra due camere e tutto quello che si sente esce dai condotti. Il rapporto fra il volume della camera anteriore e quello della posteriore governa la larghezza della banda: camera anteriore piccola significa banda stretta e livello alto, camera grande significa banda larga e livello normale.',
          'È un baratto quasi a somma costante. Sullo stesso driver, un bandpass di quarto ordine può coprire 33–94 Hz senza guadagno, mentre uno di sesto ordine copre 35–54 Hz con più di 3 dB in più: più stretto e più forte.',
        ],
      },
      {
        heading: 'Quarto o sesto ordine',
        list: [
          'Quarto ordine: camera posteriore sigillata, una sola accordata. Discesa di 12 dB per ottava da entrambi i lati, taratura relativamente tollerante.',
          'Sesto ordine: entrambe le camere accordate. In basso la discesa arriva a 24 dB per ottava, perché i due condotti tendono a cancellarsi a vicenda; in alto resta 12, perché il condotto posteriore smette di lavorare. Molto più sensibile agli errori di costruzione.',
        ],
      },
      {
        heading: 'Attenzione al condotto',
        callout: {
          kind: 'attenzione',
          text: 'Nel bandpass il driver è nascosto e TUTTA l’emissione passa dal condotto: la velocità dell’aria è più alta che in un reflex equivalente, e il soffio è il primo problema da controllare.',
        },
      },
    ],
    sources: [
      'Le pendenze sono derivate dal circuito equivalente e verificate sul motore: 12,10 dB/ott per il quarto ordine, 24 per il fianco basso del sesto',
      'Bloccando il condotto posteriore il sesto ordine si riduce al quarto entro 0,00000 dB',
    ],
    related: ['fb', 'ventvelocity', 'vb'],
  },
  {
    id: 'wiring', symbol: 'Configurazione', category: 'driver',
    title: 'Più altoparlanti: serie, parallelo, isobarico',
    summary: 'Come si combinano più driver, e cosa cambia davvero nei parametri risultanti.',
    blocks: [
      {
        paragraphs: [
          'Mettere più altoparlanti nella stessa cassa non è solo una questione di potenza: cambia l’impedenza che l’amplificatore vede, la sensibilità del sistema e il volume che serve.',
        ],
        list: [
          'Parallelo: l’impedenza si dimezza a ogni raddoppio e la corrente richiesta sale. Due driver in parallelo danno +6 dB a parità di tensione.',
          'Serie: l’impedenza raddoppia, più gentile con l’amplificatore ma serve più tensione per la stessa uscita.',
          'Isobarico: due driver accoppiati faccia a faccia o in tandem, che si muovono insieme. Il volume di cassa necessario si dimezza, ma la sensibilità non aumenta: si paga un driver in più solo per guadagnare spazio.',
          'Push-pull: due driver montati in opposizione e cablati in controfase. Non cambia il volume, ma cancella le distorsioni di ordine pari del motore.',
        ],
      },
      {
        heading: 'Attenzione al volume',
        callout: {
          kind: 'nota',
          text: 'Nel calcolo dell’ingombro contano i driver FISICI, non i coni che irradiano: in un isobarico dentro la cassa ci sono due cestelli per ogni cono utile, e occupano volume entrambi.',
        },
      },
    ],
    sources: ['Relazioni elementari di combinazione dei parametri Thiele-Small'],
    related: ['impedance', 'vb', 'sensitivity'],
  },
  {
    id: 'roomgain', symbol: 'Ambiente', category: 'cassa',
    title: 'Guadagno di ambiente',
    summary: 'Sotto una certa frequenza la stanza smette di comportarsi da spazio libero e rinforza il basso.',
    blocks: [
      {
        paragraphs: [
          'Quando la lunghezza d’onda diventa più grande della stanza, l’aria non si propaga più come un’onda ma viene compressa in blocco: la pressione sale invece di irradiarsi via. È il motivo per cui lo stesso subwoofer misurato all’aperto e in salotto dà curve molto diverse in basso.',
          'L’effetto è grande — può valere parecchi decibel a 20 Hz — ma dipende dalla stanza, dalla posizione della cassa e da quanto l’ambiente è sigillato. In un abitacolo d’auto è molto più forte che in una sala, perché il volume è piccolo e chiuso.',
        ],
      },
      {
        heading: 'Come leggerlo',
        callout: {
          kind: 'nota',
          text: 'La curva con guadagno di ambiente è una stima di tendenza, non una misura: serve a capire se il progetto avrà bisogno di aiuto in basso o se ne avrà d’avanzo. La risposta vera si misura sul posto.',
        },
      },
    ],
    sources: ['Il rinforzo di pressione sotto la frequenza di transizione della stanza è comportamento noto degli ambienti chiusi; i preset dello strumento sono valori indicativi'],
    related: ['f3', 'fb'],
  },
];

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map(e => [e.id, e]),
);

export const glossaryUrl = (id: string) => `/glossario/${id}`;
