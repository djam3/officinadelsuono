/**
 * Scelta automatica del tipo di cassa e dell'allineamento.
 *
 * Criteri classici (Small, Keele, Bullock, Dickason):
 *  - EBP = Fs/Qes  →  < 50 cassa chiusa, > 100 bass-reflex, in mezzo entrambe.
 *  - Qts decide l'allineamento reflex: Qts basso tollera box compatte (QB3),
 *    Qts alto richiede box ampie con accordo basso (C4 / SC4).
 */

import { ebpFrom } from './tsParams';
import type { AlignmentType, EnclosureType, TSParams } from './types';

export interface AlignmentInfo {
  value: AlignmentType;
  label: string;
  description: string;
  /** intervallo di Qts in cui l'allineamento dà i risultati migliori */
  qtsRange: [number, number];
}

export const ALIGNMENTS: AlignmentInfo[] = [
  { value: 'QB3', label: 'QB3 — Quasi-Butterworth 3° ordine', description: 'Box compatta, roll-off dolce. Ideale per Qts bassi.', qtsRange: [0.2, 0.32] },
  { value: 'SBB4', label: 'SBB4 — Super Boom Box', description: 'Accordo pari a Fs, box generosa, basso pieno.', qtsRange: [0.25, 0.45] },
  { value: 'B4', label: 'B4 — Butterworth 4° ordine', description: 'Risposta massimamente piatta, il riferimento classico.', qtsRange: [0.32, 0.42] },
  { value: 'BESSEL', label: 'Bessel — B4 a fase lineare', description: 'Transienti puliti e group delay minimo, F3 più alto.', qtsRange: [0.3, 0.42] },
  { value: 'C4', label: 'C4 — Chebyshev 4° ordine', description: 'Bassi estesi con lieve ripple in banda. Box più grande.', qtsRange: [0.4, 0.55] },
  { value: 'SC4', label: 'SC4 — Sub-Chebyshev', description: 'Massima estensione in basso per Qts alti. Box ampia.', qtsRange: [0.45, 0.7] },
];

export interface EnclosureSuggestion {
  ebp: number;
  type: EnclosureType;
  alignment: AlignmentType;
  reason: string;
  alternatives: EnclosureType[];
}

/** Suggerisce tipo di cassa e allineamento a partire dai parametri T/S */
export function suggestEnclosure(ts: TSParams): EnclosureSuggestion {
  const ebp = ebpFrom(ts.fs, ts.qes || ts.qts);
  const q = ts.qts;

  let type: EnclosureType;
  let reason: string;
  const alternatives: EnclosureType[] = [];

  // Sopra Qts 0.56 il reflex non esiste (la massima piattezza vuole un volume
  // negativo) e la cassa chiusa parte già sopra il Butterworth, perché il box
  // può solo ALZARE il Q. Con Vas e Sd generosi resta il pannello aperto, dove
  // la pendenza del dipolo raddrizza proprio la gobba del driver.
  if (q > 0.56 && ts.vas >= 40 && (ts.sd ?? 0) >= 200) {
    type = 'open-baffle';
    reason = `Qts ${q.toFixed(2)}: sopra 0.56 un allineamento reflex non esiste, e la cassa chiusa può solo `
      + `alzare ancora il Q (Qtc ≥ ${q.toFixed(2)} qualunque sia il volume). Con Vas ${ts.vas.toFixed(0)} L e `
      + `Sd ${(ts.sd ?? 0).toFixed(0)} cm² il driver è fatto per il pannello aperto: la discesa di 6 dB/ottava `
      + `del dipolo compensa proprio la gobba che rovina le altre due cariche.`;
    alternatives.push('sealed');
  } else if (ebp < 50) {
    type = 'sealed';
    reason = `EBP ${ebp.toFixed(0)} (< 50): il driver ha una sospensione adatta alla cassa chiusa, che darà risposta più controllata e transienti migliori.`;
    alternatives.push('passive-radiator');
  } else if (ebp > 100) {
    type = 'vented';
    reason = `EBP ${ebp.toFixed(0)} (> 100): il driver è ottimizzato per il bass-reflex, che sfrutterà l'accordo per massimizzare l'estensione e il rendimento.`;
    alternatives.push('bandpass4', 'passive-radiator');
  } else {
    type = q > 0.5 ? 'sealed' : 'vented';
    reason = `EBP ${ebp.toFixed(0)} (50–100): il driver funziona bene in entrambe le tipologie; con Qts ${q.toFixed(2)} la scelta più equilibrata è ${type === 'sealed' ? 'la cassa chiusa' : 'il bass-reflex'}.`;
    alternatives.push(type === 'sealed' ? 'vented' : 'sealed', 'passive-radiator');
  }

  // Allineamento reflex più vicino al Qts del driver
  const alignment = ALIGNMENTS.reduce((best, a) => {
    const dist = (x: AlignmentInfo) => {
      const [lo, hi] = x.qtsRange;
      return q < lo ? lo - q : q > hi ? q - hi : 0;
    };
    return dist(a) < dist(best) ? a : best;
  }, ALIGNMENTS[0]).value;

  return { ebp, type, alignment, reason, alternatives };
}

export const ENCLOSURE_LABELS: Record<EnclosureType, string> = {
  sealed: 'Cassa Chiusa (sealed)',
  vented: 'Bass-Reflex (vented)',
  'passive-radiator': 'Radiatore Passivo',
  bandpass4: 'Bandpass 4° ordine',
  bandpass6: 'Bandpass 6° ordine',
  'open-baffle': 'Pannello Aperto (dipolo)',
};
