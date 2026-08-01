/**
 * Catalogo noleggio — attrezzatura, pacchetti e condizioni.
 *
 * Tutti i prezzi sono per 24 ore, riferiti al SOLO noleggio con ritiro e
 * montaggio a cura del cliente. Le cauzioni sono indicative.
 * Per aggiungere articoli o pacchetti basta estendere gli array qui sotto.
 */

export interface RentalItem {
  id: string;
  name: string;
  category: 'audio' | 'dj' | 'microfoni' | 'video' | 'accessori' | 'informatica';
  price: number;          // € / 24h
  deposit?: number;       // cauzione indicativa €
  includes?: string[];
  note?: string;
  image?: string;         // immagine opzionale (da aggiungere in seguito)
}

export interface RentalPackage {
  id: string;
  name: string;
  priceFrom: number;      // € / 24h "da"
  priceTo?: number;       // per i pacchetti a forbice
  deposit: number;        // cauzione indicativa €
  includes: string[];
  goodFor: string[];
  note?: string;
  featured?: boolean;
  image?: string;
}

// ─── Articoli singoli ────────────────────────────────────────────────────────
export const RENTAL_ITEMS: RentalItem[] = [
  {
    id: 'impianto-fbt',
    name: 'Impianto audio FBT JMaxX 114A',
    category: 'audio',
    price: 110,
    deposit: 500,
    includes: ['2 casse attive FBT JMaxX 114A', '2 stativi professionali', 'Cavi di collegamento'],
  },
  {
    id: 'console-numark',
    name: 'Console DJ Numark Mixstream Pro',
    category: 'dj',
    price: 70,
    deposit: 500,
  },
  {
    id: 'mixer-soundcraft',
    name: 'Mixer Soundcraft EFX8',
    category: 'dj',
    price: 35,
    deposit: 250,
  },
  {
    id: 'microfoni-proel',
    name: 'Coppia microfoni wireless Proel',
    category: 'microfoni',
    price: 40,
    deposit: 200,
    includes: ['2 microfoni wireless', 'Ricevitore wireless', 'Cavi per il mixer'],
  },
  {
    id: 'videoproiettore',
    name: 'Videoproiettore con telo',
    category: 'video',
    price: 80,
    deposit: 400,
    includes: ['Videoproiettore', 'Telo di proiezione', 'Supporti / stativi', 'Cavi necessari'],
  },
  {
    id: 'tavolo-dj',
    name: 'Tavolo / consolle per DJ',
    category: 'accessori',
    price: 15,
    deposit: 50,
  },
  {
    id: 'modulo-bluetooth',
    name: 'Modulo Bluetooth',
    category: 'accessori',
    price: 10,
    note: 'Per collegare smartphone, tablet o altri dispositivi.',
  },
  {
    id: 'notebook-lenovo',
    name: 'Computer portatile Lenovo',
    category: 'informatica',
    price: 60,
    deposit: 700,
    note: 'Disponibile preferibilmente insieme ad altri pacchetti o con installazione a cura nostra.',
  },
];

// ─── Pacchetti ───────────────────────────────────────────────────────────────
export const RENTAL_PACKAGES: RentalPackage[] = [
  {
    id: 'festa',
    name: 'Pacchetto Festa',
    priceFrom: 110,
    deposit: 500,
    includes: [
      '2 casse FBT JMaxX 114A',
      '2 stativi professionali',
      'Modulo Bluetooth',
      'Cavi necessari',
    ],
    goodFor: ['Compleanni', 'Feste private', 'Piccoli eventi', 'Musica da smartphone'],
  },
  {
    id: 'karaoke',
    name: 'Pacchetto Karaoke',
    priceFrom: 170,
    deposit: 700,
    includes: [
      '2 casse FBT JMaxX 114A',
      '2 stativi',
      'Mixer Soundcraft EFX8',
      '2 microfoni wireless Proel',
      'Modulo Bluetooth',
      'Cavi necessari',
    ],
    goodFor: ['Karaoke', 'Feste', 'Cantanti', 'Animazione', 'Piccoli spettacoli'],
    featured: true,
  },
  {
    id: 'console-dj',
    name: 'Pacchetto Console DJ',
    priceFrom: 190,
    deposit: 900,
    includes: [
      '2 casse FBT JMaxX 114A',
      '2 stativi',
      'Console Numark Mixstream Pro',
      'Cavi necessari',
    ],
    goodFor: ['DJ', 'Feste private', 'Diciottesimi', 'Piccoli eventi musicali'],
    note: 'Il servizio DJ non è incluso.',
  },
  {
    id: 'audio-video',
    name: 'Pacchetto Audio e Video',
    priceFrom: 280,
    deposit: 900,
    includes: [
      '2 casse FBT JMaxX 114A',
      '2 stativi',
      'Videoproiettore',
      'Telo di proiezione con supporti',
      'Cavi necessari',
    ],
    goodFor: ['Proiezioni', 'Feste', 'Presentazioni', 'Eventi aziendali', 'Video e musica'],
  },
  {
    id: 'completo',
    name: 'Pacchetto Completo',
    priceFrom: 450,
    priceTo: 500,
    deposit: 1200,
    includes: [
      '2 casse FBT JMaxX 114A',
      '2 stativi',
      'Console Numark Mixstream Pro',
      'Mixer Soundcraft EFX8',
      '2 microfoni wireless Proel',
      'Videoproiettore',
      'Telo con supporti',
      'Tavolo DJ',
      'Modulo Bluetooth',
      'Cavi necessari',
    ],
    goodFor: ['Eventi completi', 'Cerimonie', 'Serate con DJ e proiezioni'],
    note: 'Il prezzo preciso dipende dall\'attrezzatura effettivamente richiesta.',
  },
];

// ─── Occasioni d'uso ─────────────────────────────────────────────────────────
export const RENTAL_OCCASIONS = [
  'Compleanni', 'Feste private', 'Diciottesimi', 'Karaoke', 'Cerimonie',
  'Piccoli eventi', 'Associazioni', 'Bar', 'DJ e cantanti', 'Presentazioni e proiezioni',
];

// ─── Cosa è incluso / cosa no ────────────────────────────────────────────────
export const PRICE_INCLUDES = [
  'Noleggio dell\'attrezzatura',
  'Ritiro da parte del cliente',
  'Montaggio e collegamento a cura del cliente',
  'Durata standard di circa 24 ore, salvo accordi differenti',
];

export const PRICE_EXCLUDES = [
  'DJ', 'Animatore', 'Cantante', 'Trasporto', 'Consegna', 'Ritiro a domicilio',
  'Montaggio', 'Smontaggio', 'Tecnico presente durante l\'evento',
];

/** Dicitura obbligatoria da usare in tutte le comunicazioni sui prezzi */
export const PRICE_DISCLAIMER =
  'Prezzi riferiti al solo noleggio con ritiro e montaggio a cura del cliente. DJ, consegna, installazione e servizi extra non inclusi. Consegna e installazione disponibili su preventivo.';

export const EXTRA_SERVICES_NOTE =
  'Consegna, montaggio e servizi extra si pagano a parte e vengono calcolati in base a distanza, quantità di attrezzatura, difficoltà dell\'installazione, orario di consegna e ritiro ed eventuale permanenza del tecnico.';

// ─── Regole di noleggio ──────────────────────────────────────────────────────
export const RENTAL_REQUIREMENTS = [
  'Documento di identità',
  'Codice fiscale',
  'Indirizzo e numero di telefono',
  'Firma del contratto',
  'Cauzione o preautorizzazione',
  'Verbale di consegna e restituzione',
  'Controllo dell\'attrezzatura con fotografie prima e dopo',
];

export const PAYMENT_RULES = [
  '30% alla prenotazione per bloccare la data',
  'Saldo prima del ritiro o della consegna',
  'Cauzione separata dal prezzo del noleggio',
  'Nessuna consegna senza saldo e documenti completati',
];

export const DEPOSIT_RETURN_RULES = [
  'Riconsegna puntuale',
  'Controllo dell\'attrezzatura',
  'Verifica dell\'assenza di danni',
  'Restituzione di tutti gli accessori e i cavi',
];
