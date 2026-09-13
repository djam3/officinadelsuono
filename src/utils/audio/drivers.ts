/**
 * Configurazioni ad altoparlanti multipli.
 *
 * Trasforma N altoparlanti identici in un driver equivalente da dare al motore
 * di progetto della cassa (Vas, Sd, Vd, impedenza, potenza, sensibilità).
 *
 * Regole standard:
 *  - Parallelo / serie / push-pull: N coni radianti → Vas·N, Sd·N, Vd·N.
 *    Fs e Qts restano invariati (i driver sono identici e condividono il volume).
 *  - Isobarico: coppie accoppiate, un solo cono irradia nell'ambiente.
 *    La massa mobile raddoppia e la compliance si dimezza → Vas della coppia
 *    è metà di quella del singolo: stessa risposta in METÀ del volume.
 *  - Sensibilità a 1 W: +10·log10(N) per accoppiamento mutuo (isobarico −3 dB,
 *    perché servono due motori per muovere un solo cono).
 *
 * La connessione elettrica è indipendente dalla disposizione acustica: si
 * sceglie con `electrical` per isobarico e push-pull, mentre serie e parallelo
 * la dichiarano già nel nome. Cambia impedenza, potenza e BL equivalente, ma
 * non la risposta acustica: Fs, Qts e Vas restano gli stessi.
 */

import type { DriverConfig, TSParams } from './types';

export interface EffectiveDriver {
  ts: TSParams;
  /** coni che irradiano verso l'ambiente */
  radiatingCones: number;
  /** impedenza totale vista dall'amplificatore (Ω) */
  totalImpedance: number;
  /** resistenza DC totale (Ω) */
  totalRe: number;
  /** potenza termica totale sopportabile (W) */
  totalPower: number;
  /** variazione di sensibilità rispetto al singolo driver a 1 W (dB) */
  sensitivityDelta: number;
  /** avvisi sulla configurazione (es. impedenza troppo bassa) */
  warnings: string[];
}

export function combineDrivers(ts: TSParams, config: DriverConfig): EffectiveDriver {
  const n = Math.max(1, Math.round(config.count));
  const wiring = config.wiring;
  const warnings: string[] = [];

  const zSingle = ts.impedance ?? 8;
  const reSingle = ts.re ?? zSingle * 0.85;
  const peSingle = ts.pe ?? 0;

  let radiatingCones: number;
  let vasFactor: number;   // moltiplicatore su Vas
  let sdFactor: number;    // moltiplicatore su Sd e Vd
  let mmsFactor: number;
  let sensitivityDelta: number;

  if (wiring === 'isobaric') {
    // n = numero TOTALE di altoparlanti, a coppie
    const pairs = Math.max(1, Math.floor(n / 2));
    if (n % 2 !== 0) warnings.push('La configurazione isobarica richiede un numero pari di altoparlanti.');
    radiatingCones = pairs;
    vasFactor = pairs / 2;      // ogni coppia richiede metà volume di un singolo
    sdFactor = pairs;
    mmsFactor = 2 * pairs;
    sensitivityDelta = 10 * Math.log10(pairs) - 3; // due motori per un solo cono
  } else {
    radiatingCones = n;
    vasFactor = n;
    sdFactor = n;
    mmsFactor = n;
    sensitivityDelta = n > 1 ? 10 * Math.log10(n) : 0;
    if (wiring === 'push-pull' && n % 2 !== 0) {
      warnings.push('Il push-pull richiede un numero pari di altoparlanti (uno invertito per coppia).');
    }
  }

  // ── Carico elettrico ──────────────────────────────────────────────────────
  // La disposizione acustica non impone il cablaggio: un isobarico o un
  // push-pull si fanno sia in serie sia in parallelo. Dove la disposizione non
  // lo dice, si usa `electrical` (parallelo per compatibilita con i progetti
  // salvati prima che il campo esistesse).
  const inSerie = wiring === 'series'
    || ((wiring === 'isobaric' || wiring === 'push-pull') && config.electrical === 'series');
  let totalImpedance = zSingle;
  let totalRe = reSingle;
  if (n > 1) {
    if (inSerie) {
      totalImpedance = zSingle * n;
      totalRe = reSingle * n;
    } else {
      totalImpedance = zSingle / n;
      totalRe = reSingle / n;
    }
  }
  if (totalImpedance < 2) {
    warnings.push(`Carico risultante ${totalImpedance.toFixed(1)}Ω: verifica che l'amplificatore lo supporti.`);
  }

  // Il BL equivalente segue il cablaggio, e va scalato con esso.
  //
  // Con n driver in SERIE la stessa corrente attraversa tutti i motori, quindi
  // la forza sul cono equivalente e n volte quella di uno solo: BL_eq = n*BL.
  // In parallelo la corrente totale si divide fra i motori e il BL equivalente
  // resta quello del singolo.
  //
  // Senza questa scala il Qes del driver equivalente non tornava piu con BL,
  // Mms e Re: su una coppia in serie risultava 1.76 invece di 0.44, e
  // l'escursione calcolata veniva la meta di quella del parallelo, quando le
  // due devono coincidere — a parita di potenza totale ciascun driver riceve
  // P/n in entrambi i casi.
  const blFactor = inSerie && n > 1 ? n : 1;

  const effective: TSParams = {
    ...ts,
    bl: ts.bl !== undefined ? ts.bl * blFactor : undefined,
    vas: ts.vas * vasFactor,
    sd: ts.sd !== undefined ? ts.sd * sdFactor : undefined,
    vd: ts.vd !== undefined ? ts.vd * sdFactor : undefined,
    mms: ts.mms !== undefined ? ts.mms * mmsFactor : undefined,
    cms: ts.cms !== undefined ? ts.cms / (wiring === 'isobaric' ? 2 : 1) : undefined,
    re: totalRe,
    impedance: totalImpedance,
    pe: peSingle * n,
    sensitivity: ts.sensitivity !== undefined ? ts.sensitivity + sensitivityDelta : undefined,
  };

  return {
    ts: effective,
    radiatingCones,
    totalImpedance,
    totalRe,
    totalPower: peSingle * n,
    sensitivityDelta,
    warnings,
  };
}

export const WIRING_LABELS: Record<DriverConfig['wiring'], string> = {
  single: 'Singolo altoparlante',
  parallel: 'Parallelo',
  series: 'Serie',
  isobaric: 'Isobarico (accoppiati)',
  'push-pull': 'Push-pull (uno invertito)',
};
