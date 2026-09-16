/**
 * Le varianti di palette, per sceglierle guardandole una accanto all'altra.
 *
 * Non sono tre gradazioni della stessa idea: sono tre registri diversi, e
 * ciascuno dice una cosa diversa su cosa sia questo strumento.
 *
 * Il vincolo che vale per tutte e tre: nell'interfaccia il caldo è UNO SOLO ed
 * è quello degli avvisi. Se l'accento è freddo, l'avviso è ambra; se l'accento
 * è caldo, l'avviso si sposta su un giallo che con quell'accento non si
 * confonde. Due caldi vicini si contendono lo sguardo e a perdere è sempre
 * l'avviso, che è l'unica cosa che DEVE farsi notare.
 */

export interface Palette {
  id: string;
  nome: string;
  registro: string;
  descrizione: string;
  /** perché potrebbe essere quella giusta, e perché no */
  pro: string;
  contro: string;
  token: {
    ink: string;
    ink2: string;
    ink3: string;
    ink4: string;
    paper: string;
    graphite: string;
    graphiteDim: string;
    blueprint: string;
    marker: string;
    markerDim: string;
    mdf: string;
    segnale: string;
  };
}

export const PALETTE: Palette[] = [
  {
    id: 'strumento',
    nome: 'Strumento',
    registro: 'Elettronica di misura',
    descrizione:
      'Fondo quasi nero con dominante blu, accento nel verde-azzurro di una traccia su schermo. È il registro dell’oscilloscopio e del software di misura.',
    pro: 'Dice subito che qui si misura. L’accento è vivo senza essere sgargiante, e le curve dei grafici ci stanno dentro naturalmente.',
    contro: 'È il registro più diffuso fra gli strumenti tecnici: corre il rischio di somigliare a molti altri.',
    token: {
      ink: '#0A0D11', ink2: '#11161D', ink3: '#19212A', ink4: '#232D39',
      paper: '#E4EAF0', graphite: '#8895A5', graphiteDim: '#5A6675',
      blueprint: '#6E90B4', marker: '#35CFC0', markerDim: '#1E8E85',
      mdf: '#C08A4E', segnale: '#E8A83C',
    },
  },
  {
    id: 'cianografia',
    nome: 'Cianografia',
    registro: 'Carta da disegno',
    descrizione:
      'Il fondo non è nero ma blu profondo, come una copia eliografica vera, e il tratto è azzurro carta. L’accento è un azzurro chiaro che sul blu si stacca senza gridare.',
    pro: 'È l’unica delle tre che assomiglia davvero a un disegno tecnico su carta, non a un programma. Gli avvisi ambra ci spiccano moltissimo.',
    contro: 'Il fondo blu riduce il contrasto disponibile: il grigio tenue è stato schiarito a #7590AC per arrivare a 5,4:1 sul fondo, e le fotografie su questo blu ci stanno male.',
    token: {
      ink: '#0B1826', ink2: '#122335', ink3: '#1A2E44', ink4: '#254057',
      paper: '#DCE9F5', graphite: '#8EA8C2', graphiteDim: '#7590AC',
      blueprint: '#7FB2D9', marker: '#7FD8F5', markerDim: '#3E8FB0',
      mdf: '#C9A063', segnale: '#F0B94A',
    },
  },
  {
    id: 'minio',
    nome: 'Grafite e minio',
    registro: 'Officina meccanica',
    descrizione:
      'Grigio neutro invece del blu, e accento nel rosso-arancio dell’antiruggine — il colore con cui in officina si segnano i riferimenti. Gli avvisi passano al giallo, che con quel rosso non si confonde.',
    pro: 'Il più materiale e il meno digitale dei tre. L’accento caldo su grigio neutro ha molta più forza di un freddo, e si legge da lontano.',
    contro: 'Riporta un caldo nell’interfaccia: gli avvisi devono spostarsi sul giallo per restare distinguibili, e la distanza fra i due è meno netta.',
    token: {
      ink: '#0F1113', ink2: '#17191C', ink3: '#212429', ink4: '#2D3137',
      paper: '#E9E9E7', graphite: '#93948F', graphiteDim: '#62635F',
      blueprint: '#8A9AA8', marker: '#E5533D', markerDim: '#9C3527',
      mdf: '#B98A52', segnale: '#F2C230',
    },
  },
];

/** scelta il 16 settembre 2026: e' la palette con cui il sito e' compilato */
export const PALETTE_DEFAULT = 'cianografia';
const CHIAVE = 'ods-palette';

/**
 * Scrive le variabili sul documento.
 *
 * Funziona perché i colori del tema sono variabili CSS e le classi di utilità
 * le leggono con `var()`: riscriverle a runtime cambia tutto il sito senza
 * ricompilare niente. Restano fuori i pochi colori scritti a mano dentro i
 * grafici SVG, che vanno cambiati nel codice — sono segnalati nella pagina.
 */
export function applicaPalette(id: string): void {
  const p = PALETTE.find(x => x.id === id) ?? PALETTE[0];
  const r = document.documentElement.style;
  r.setProperty('--color-ink', p.token.ink);
  r.setProperty('--color-ink-2', p.token.ink2);
  r.setProperty('--color-ink-3', p.token.ink3);
  r.setProperty('--color-ink-4', p.token.ink4);
  r.setProperty('--color-paper', p.token.paper);
  r.setProperty('--color-graphite', p.token.graphite);
  r.setProperty('--color-graphite-dim', p.token.graphiteDim);
  r.setProperty('--color-blueprint', p.token.blueprint);
  r.setProperty('--color-marker', p.token.marker);
  r.setProperty('--color-marker-dim', p.token.markerDim);
  r.setProperty('--color-mdf', p.token.mdf);
  r.setProperty('--color-segnale', p.token.segnale);
  // il fondo della pagina è dichiarato anche fuori dal tema, per il primo
  // fotogramma: va cambiato anche lì o resta quello vecchio dietro tutto
  document.body.style.backgroundColor = p.token.ink;
  const root = document.getElementById('root');
  if (root) root.style.backgroundColor = p.token.ink;
  try {
    localStorage.setItem(CHIAVE, id);
  } catch {
    // navigazione privata o memoria piena: la scelta vale solo per questa visita
  }
}

export function paletteSalvata(): string {
  try {
    return localStorage.getItem(CHIAVE) ?? PALETTE_DEFAULT;
  } catch {
    return PALETTE_DEFAULT;
  }
}
