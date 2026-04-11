/**
 * Servizio calcolo costi spedizione 24h in Italia
 * Tariffe basate su corrieri espresso (BRT/GLS/SDA)
 * Peso volumetrico: (L × W × H cm) / 5000
 */

export interface ProductDimensions {
  lunghezza: number; // cm
  larghezza: number; // cm
  altezza: number;   // cm
}

export interface ShippingResult {
  costo: number;          // € spedizione
  gratuita: boolean;      // true se sopra soglia
  pesoFatturato: number;  // kg usato per calcolo
  pesoVolumetrico: number;
  pesoReale: number;
  corriere: string;
  stimaConsegna: string;
}

// Soglia spedizione gratuita
export const SOGLIA_SPEDIZIONE_GRATUITA = 199;

// Tariffe corriere espresso 24h (BRT/GLS - contratto small business tipico Italia)
const TARIFFE_24H: Array<{ maxKg: number; prezzo: number }> = [
  { maxKg: 1,        prezzo: 5.90  },
  { maxKg: 3,        prezzo: 7.90  },
  { maxKg: 5,        prezzo: 9.90  },
  { maxKg: 10,       prezzo: 12.90 },
  { maxKg: 20,       prezzo: 17.90 },
  { maxKg: 30,       prezzo: 24.90 },
  { maxKg: 50,       prezzo: 34.90 },
  { maxKg: Infinity, prezzo: -1    }, // preventivo manuale
];

/**
 * Calcola il peso volumetrico in kg
 * Formula standard corrieri: (L × W × H) / 5000
 */
export function calcolaPesoVolumetrico(dims: ProductDimensions): number {
  return (dims.lunghezza * dims.larghezza * dims.altezza) / 5000;
}

/**
 * Restituisce il peso fatturabile (max tra reale e volumetrico)
 */
export function calcolaPesoFatturato(pesoRealeKg: number, dims?: ProductDimensions): number {
  if (!dims) return pesoRealeKg;
  const volWeight = calcolaPesoVolumetrico(dims);
  return Math.max(pesoRealeKg, volWeight);
}

/**
 * Calcola la tariffa 24h per un singolo peso
 */
function tariffa24h(pesoKg: number): number {
  const fascia = TARIFFE_24H.find(t => pesoKg <= t.maxKg);
  return fascia?.prezzo ?? -1;
}

/**
 * Calcola il costo di spedizione per un singolo prodotto
 */
export function calcolaSpedizioneProdotto(
  prezzoOrdine: number,
  pesoKg: number,
  dims?: ProductDimensions
): ShippingResult {
  const pesoVolumetrico = dims ? calcolaPesoVolumetrico(dims) : 0;
  const pesoFatturato = dims ? Math.max(pesoKg, pesoVolumetrico) : pesoKg;
  const gratuita = prezzoOrdine >= SOGLIA_SPEDIZIONE_GRATUITA;
  const costo = gratuita ? 0 : tariffa24h(pesoFatturato);

  return {
    costo,
    gratuita,
    pesoFatturato: Math.round(pesoFatturato * 100) / 100,
    pesoVolumetrico: Math.round(pesoVolumetrico * 100) / 100,
    pesoReale: pesoKg,
    corriere: 'BRT / GLS',
    stimaConsegna: '24h lavorative',
  };
}

export interface CartItemShipping {
  pesoKg: number;
  dims?: ProductDimensions;
  quantita: number;
}

/**
 * Calcola il costo di spedizione totale per un carrello
 * I colli vengono sommati; il peso volumetrico si calcola per ogni articolo
 */
export function calcolaSpedizioneCarrello(
  totaleOrdine: number,
  articoli: CartItemShipping[]
): ShippingResult {
  if (articoli.length === 0) {
    return {
      costo: 0,
      gratuita: false,
      pesoFatturato: 0,
      pesoVolumetrico: 0,
      pesoReale: 0,
      corriere: 'BRT / GLS',
      stimaConsegna: '24h lavorative',
    };
  }

  let totPesoReale = 0;
  let totPesoVol = 0;

  for (const art of articoli) {
    const q = art.quantita;
    totPesoReale += art.pesoKg * q;
    if (art.dims) {
      totPesoVol += calcolaPesoVolumetrico(art.dims) * q;
    }
  }

  const pesoFatturato = Math.max(totPesoReale, totPesoVol);
  const gratuita = totaleOrdine >= SOGLIA_SPEDIZIONE_GRATUITA;
  const costo = gratuita ? 0 : tariffa24h(pesoFatturato);

  return {
    costo,
    gratuita,
    pesoFatturato: Math.round(pesoFatturato * 100) / 100,
    pesoVolumetrico: Math.round(totPesoVol * 100) / 100,
    pesoReale: Math.round(totPesoReale * 100) / 100,
    corriere: 'BRT / GLS',
    stimaConsegna: '24h lavorative',
  };
}

/**
 * Formatta il costo spedizione come stringa leggibile
 */
export function formatCostoSpedizione(result: ShippingResult): string {
  if (result.gratuita) return 'Gratuita';
  if (result.costo === -1) return 'Preventivo';
  return `€${result.costo.toFixed(2)}`;
}

/**
 * Restituisce quanti euro mancano alla spedizione gratuita
 */
export function mancaAllaGratuita(totaleOrdine: number): number {
  const diff = SOGLIA_SPEDIZIONE_GRATUITA - totaleOrdine;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}
