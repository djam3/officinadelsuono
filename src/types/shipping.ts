export interface FasciaTariffaria {
  maxKg: number;   // Infinity per l'ultima fascia (preventivo)
  prezzo: number;  // -1 = preventivo manuale
}

export interface ExtraCharges {
  isole?: number;          // surcharge isole italiane (€)
  zonaRemota?: number;     // surcharge zone disagiate (€)
  assicurazione?: number;  // % del valore dichiarato (es. 0.5 = 0.5%)
  contrassegno?: number;   // € per pagamento alla consegna
  consegnaSabato?: number; // € supplemento sabato
  primaOra?: number;       // € consegna fascia oraria
}

export interface Corriere {
  id: string;
  nome: string;           // "BRT Bartolini"
  codice: string;         // "brt"
  logoUrl?: string;
  colore: string;         // hex brand color
  attivo: boolean;
  tipo: 'manuale' | 'api';
  stimaConsegna: string;  // "24h lavorative"
  tariffe: FasciaTariffaria[];
  extra: ExtraCharges;
  note?: string;
  sito?: string;          // URL portale spedizioni
  apiCredentials?: {
    endpoint?: string;
    clientId?: string;
    clientSecret?: string;
    accountNumber?: string;
    username?: string;
    password?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QuotaCorriere {
  corriere: Corriere;
  pesoFatturato: number;
  pesoVolumetrico: number;
  pesoReale: number;
  costoBase: number;
  costoTotale: number;
  gratuita: boolean;
  preventivo: boolean;    // true se peso fuori scala
  stimaConsegna: string;
}

export interface ShippingSettings {
  sogliaGratuita: number;       // € soglia spedizione gratuita
  corriereDefault?: string;     // codice corriere predefinito
  volumetricoDivisore: number;  // default 5000
  updatedAt: string;
}

// Corrieri italiani pre-configurati con tariffe indicative
export const CORRIERI_DEFAULT: Omit<Corriere, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    nome: 'BRT Bartolini',
    codice: 'brt',
    colore: '#E30613',
    attivo: true,
    tipo: 'manuale',
    stimaConsegna: '24h lavorative',
    sito: 'https://www.brt.it',
    extra: { isole: 3.50, zonaRemota: 5.00, contrassegno: 4.00 },
    tariffe: [
      { maxKg: 1,   prezzo: 5.50 },
      { maxKg: 3,   prezzo: 7.50 },
      { maxKg: 5,   prezzo: 9.50 },
      { maxKg: 10,  prezzo: 12.50 },
      { maxKg: 20,  prezzo: 17.00 },
      { maxKg: 30,  prezzo: 23.00 },
      { maxKg: 50,  prezzo: 32.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
  {
    nome: 'GLS Italy',
    codice: 'gls',
    colore: '#009DE0',
    attivo: true,
    tipo: 'manuale',
    stimaConsegna: '24h lavorative',
    sito: 'https://gls-group.com/IT',
    extra: { isole: 4.00, zonaRemota: 5.50, contrassegno: 4.50 },
    tariffe: [
      { maxKg: 1,   prezzo: 5.80 },
      { maxKg: 3,   prezzo: 7.80 },
      { maxKg: 5,   prezzo: 9.80 },
      { maxKg: 10,  prezzo: 13.00 },
      { maxKg: 20,  prezzo: 18.50 },
      { maxKg: 30,  prezzo: 25.00 },
      { maxKg: 50,  prezzo: 35.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
  {
    nome: 'SDA Poste Italiane',
    codice: 'sda',
    colore: '#FFCC00',
    attivo: true,
    tipo: 'manuale',
    stimaConsegna: '24/48h lavorative',
    sito: 'https://www.sda.it',
    extra: { isole: 5.00, zonaRemota: 6.00, contrassegno: 5.00 },
    tariffe: [
      { maxKg: 1,   prezzo: 6.50 },
      { maxKg: 3,   prezzo: 8.50 },
      { maxKg: 5,   prezzo: 10.50 },
      { maxKg: 10,  prezzo: 14.00 },
      { maxKg: 20,  prezzo: 20.00 },
      { maxKg: 30,  prezzo: 27.00 },
      { maxKg: 50,  prezzo: 38.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
  {
    nome: 'DHL Express',
    codice: 'dhl',
    colore: '#FFCC00',
    attivo: false,
    tipo: 'manuale',
    stimaConsegna: '24h garantite',
    sito: 'https://www.dhl.com/it',
    extra: { isole: 0, zonaRemota: 0, assicurazione: 0.5 },
    tariffe: [
      { maxKg: 1,   prezzo: 12.00 },
      { maxKg: 3,   prezzo: 15.00 },
      { maxKg: 5,   prezzo: 18.00 },
      { maxKg: 10,  prezzo: 25.00 },
      { maxKg: 20,  prezzo: 40.00 },
      { maxKg: 30,  prezzo: 55.00 },
      { maxKg: 50,  prezzo: 75.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
  {
    nome: 'UPS Standard',
    codice: 'ups',
    colore: '#351C15',
    attivo: false,
    tipo: 'manuale',
    stimaConsegna: '24/48h lavorative',
    sito: 'https://www.ups.com/it',
    extra: { isole: 3.00, zonaRemota: 4.50, contrassegno: 5.50 },
    tariffe: [
      { maxKg: 1,   prezzo: 7.00 },
      { maxKg: 3,   prezzo: 9.00 },
      { maxKg: 5,   prezzo: 11.00 },
      { maxKg: 10,  prezzo: 15.00 },
      { maxKg: 20,  prezzo: 21.00 },
      { maxKg: 30,  prezzo: 28.00 },
      { maxKg: 50,  prezzo: 40.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
  {
    nome: 'TNT / FedEx',
    codice: 'tnt',
    colore: '#FF6600',
    attivo: false,
    tipo: 'manuale',
    stimaConsegna: '24h lavorative',
    sito: 'https://www.tnt.com/it',
    extra: { isole: 4.00, zonaRemota: 5.00 },
    tariffe: [
      { maxKg: 1,   prezzo: 6.00 },
      { maxKg: 3,   prezzo: 8.00 },
      { maxKg: 5,   prezzo: 10.00 },
      { maxKg: 10,  prezzo: 13.50 },
      { maxKg: 20,  prezzo: 19.00 },
      { maxKg: 30,  prezzo: 26.00 },
      { maxKg: 50,  prezzo: 37.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
  {
    nome: 'Nexive / PosteDelivery',
    codice: 'nexive',
    colore: '#007DC5',
    attivo: false,
    tipo: 'manuale',
    stimaConsegna: '48/72h lavorative',
    sito: 'https://www.nexive.it',
    extra: { isole: 5.00, zonaRemota: 7.00 },
    tariffe: [
      { maxKg: 1,   prezzo: 4.50 },
      { maxKg: 3,   prezzo: 6.50 },
      { maxKg: 5,   prezzo: 8.50 },
      { maxKg: 10,  prezzo: 11.00 },
      { maxKg: 20,  prezzo: 16.00 },
      { maxKg: 30,  prezzo: 22.00 },
      { maxKg: 50,  prezzo: 30.00 },
      { maxKg: Infinity, prezzo: -1 },
    ],
  },
];
