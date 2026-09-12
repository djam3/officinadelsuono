/**
 * Verifica di congruenza dei parametri Thiele-Small.
 *
 * I parametri T/S sono sovradeterminati: fra loro valgono identità esatte.
 * Se l'utente inserisce valori presi da schede tecniche diverse — o sbaglia a
 * digitare — le identità non tornano più. Qui ogni parametro viene ricalcolato
 * dagli altri INSERITI A MANO (mai dai derivati, altrimenti si confermerebbe
 * da solo) e confrontato con il valore dichiarato.
 */

import {
  qtsFrom, qesFrom, qmsFrom, fsFrom, cmsFromMms, mmsFrom, vasFrom, cmsFrom,
  qmsFromRms, rmsFrom, qesFromBl, blFrom, sdFromDia, diaFromSd, vdFrom,
  eta0From, sensitivityFrom,
} from './tsParams';
import type { TSInput, TSParams } from './types';

export type ParamStatus = 'ok' | 'error' | 'unknown';

export interface ParamCheck {
  status: ParamStatus;
  /** valore che il parametro dovrebbe avere secondo le altre grandezze */
  expected?: number;
  /** scostamento relativo (0.08 = 8%) */
  deviation?: number;
  message: string;
}

export type ValidationMap = Partial<Record<keyof TSParams, ParamCheck>>;

export interface ValidationResult {
  checks: ValidationMap;
  errorCount: number;
  verifiedCount: number;
}

const has = (v: unknown): v is number => typeof v === 'number' && isFinite(v) && v !== 0;

interface Relation {
  /** grandezze che la relazione mette in rapporto */
  keys: (keyof TSParams)[];
  /** valore atteso di `target` dalle altre; null se mancano dati */
  solve: (p: TSInput, target: keyof TSParams) => number | null;
  /** tolleranza relativa accettata (gli arrotondamenti dei datasheet) */
  tolerance: number;
  label: string;
}

const RELATIONS: Relation[] = [
  {
    label: 'Qts = Qms · Qes / (Qms + Qes)',
    keys: ['qts', 'qms', 'qes'],
    tolerance: 0.05,
    solve: (p, t) => {
      if (t === 'qts' && has(p.qms) && has(p.qes)) return qtsFrom(p.qms, p.qes);
      if (t === 'qes' && has(p.qms) && has(p.qts) && p.qms > p.qts) return qesFrom(p.qms, p.qts);
      if (t === 'qms' && has(p.qes) && has(p.qts) && p.qes > p.qts) return qmsFrom(p.qes, p.qts);
      return null;
    },
  },
  {
    label: 'Fs = 1 / (2π·√(Cms · Mms))',
    keys: ['fs', 'cms', 'mms'],
    tolerance: 0.06,
    solve: (p, t) => {
      if (t === 'fs' && has(p.cms) && has(p.mms)) return fsFrom(p.cms, p.mms);
      if (t === 'cms' && has(p.fs) && has(p.mms)) return cmsFromMms(p.fs, p.mms);
      if (t === 'mms' && has(p.fs) && has(p.cms)) return mmsFrom(p.fs, p.cms);
      return null;
    },
  },
  {
    label: 'Vas = ρ·c² · Sd² · Cms',
    keys: ['vas', 'sd', 'cms'],
    tolerance: 0.08,
    solve: (p, t) => {
      if (t === 'vas' && has(p.sd) && has(p.cms)) return vasFrom(p.sd, p.cms);
      if (t === 'cms' && has(p.vas) && has(p.sd)) return cmsFrom(p.vas, p.sd);
      return null;
    },
  },
  {
    label: 'Qms = 2π·Fs·Mms / Rms',
    keys: ['qms', 'fs', 'mms', 'rms'],
    tolerance: 0.08,
    solve: (p, t) => {
      if (t === 'qms' && has(p.fs) && has(p.mms) && has(p.rms)) return qmsFromRms(p.fs, p.mms, p.rms);
      if (t === 'rms' && has(p.fs) && has(p.mms) && has(p.qms)) return rmsFrom(p.fs, p.mms, p.qms);
      return null;
    },
  },
  {
    label: 'Qes = 2π·Fs·Mms·Re / BL²',
    keys: ['qes', 'fs', 'mms', 're', 'bl'],
    tolerance: 0.10,
    solve: (p, t) => {
      if (t === 'qes' && has(p.fs) && has(p.mms) && has(p.re) && has(p.bl)) return qesFromBl(p.fs, p.mms, p.re, p.bl);
      if (t === 'bl' && has(p.fs) && has(p.mms) && has(p.re) && has(p.qes)) return blFrom(p.fs, p.mms, p.re, p.qes);
      return null;
    },
  },
  {
    label: 'Sd = π · (Dia / 2)²',
    keys: ['sd', 'dia'],
    tolerance: 0.12,
    solve: (p, t) => {
      if (t === 'sd' && has(p.dia)) return sdFromDia(p.dia);
      if (t === 'dia' && has(p.sd)) return diaFromSd(p.sd);
      return null;
    },
  },
  {
    label: 'Vd = Sd · Xmax',
    keys: ['vd', 'sd', 'xmax'],
    tolerance: 0.05,
    solve: (p, t) => {
      if (t === 'vd' && has(p.sd) && has(p.xmax)) return vdFrom(p.sd, p.xmax);
      return null;
    },
  },
  {
    // Fs al cubo: un piccolo errore su Fs si amplifica molto, tolleranza ampia
    label: 'η0 = (4π²/c³) · Fs³ · Vas / Qes',
    keys: ['eta0', 'fs', 'vas', 'qes'],
    tolerance: 0.20,
    solve: (p, t) => {
      if (t === 'eta0' && has(p.fs) && has(p.vas) && has(p.qes)) return eta0From(p.fs, p.vas, p.qes);
      return null;
    },
  },
  {
    label: 'Sensibilità = 112.16 + 10·log10(η0)',
    keys: ['sensitivity', 'eta0'],
    tolerance: 0.02, // ≈ ±1.8 dB su 90 dB
    solve: (p, t) => {
      if (t === 'sensitivity' && has(p.eta0)) return sensitivityFrom(p.eta0);
      return null;
    },
  },
];

const UNITS: Partial<Record<keyof TSParams, string>> = {
  fs: 'Hz', vas: 'L', cms: 'mm/N', mms: 'g', rms: 'kg/s', sd: 'cm²',
  dia: 'mm', vd: 'cm³', re: 'Ω', le: 'mH', bl: 'T·m', pe: 'W',
  xmax: 'mm', xmech: 'mm', impedance: 'Ω', eta0: '%', sensitivity: 'dB',
};

const fmt = (v: number, key: keyof TSParams) => {
  const unit = UNITS[key] ? ` ${UNITS[key]}` : '';
  const digits = Math.abs(v) < 1 ? 3 : Math.abs(v) < 100 ? 2 : 0;
  return `${v.toFixed(digits)}${unit}`;
};

/**
 * Vincoli che non ammettono tolleranza: se saltano, il set di parametri è
 * fisicamente impossibile, non solo impreciso.
 */
function hardConstraints(p: TSInput): ValidationMap {
  const out: ValidationMap = {};

  // Qts è il parallelo di Qms e Qes: deve essere minore di entrambi
  if (has(p.qts) && has(p.qms) && p.qts >= p.qms) {
    out.qts = { status: 'error', message: `Qts deve essere minore di Qms (${p.qms}): è il parallelo di Qms e Qes, non può superarli.` };
  }
  if (has(p.qts) && has(p.qes) && p.qts >= p.qes && !out.qts) {
    out.qts = { status: 'error', message: `Qts deve essere minore di Qes (${p.qes}): è il parallelo di Qms e Qes, non può superarli.` };
  }

  // La resistenza in continua sta sempre sotto l'impedenza nominale
  if (has(p.re) && has(p.impedance) && p.re > p.impedance) {
    out.re = { status: 'error', message: `Re (${p.re}Ω) non può superare l'impedenza nominale (${p.impedance}Ω): tipicamente vale il 75–90% di Z.` };
  }

  // L'escursione meccanica è il fondo corsa: non può stare sotto quella lineare
  if (has(p.xmech) && has(p.xmax) && p.xmech < p.xmax) {
    out.xmech = { status: 'error', message: `Xmech (${p.xmech}mm) è il limite meccanico: non può essere minore di Xmax (${p.xmax}mm).` };
  }

  return out;
}

/**
 * Verifica l'intero set. `input` deve contenere solo i valori inseriti
 * dall'utente: i parametri derivati automaticamente sono coerenti per
 * costruzione e confermerebbero sé stessi.
 */
export function validateTSParams(input: TSInput): ValidationResult {
  const checks: ValidationMap = {};

  for (const relation of RELATIONS) {
    for (const target of relation.keys) {
      const actual = input[target];
      if (!has(actual)) continue;

      // il valore atteso si calcola solo dalle ALTRE grandezze della relazione
      const others: TSInput = { ...input };
      delete others[target];
      const expected = relation.solve(others, target);
      if (expected === null || !isFinite(expected) || expected === 0) continue;

      const deviation = Math.abs(actual - expected) / Math.abs(expected);
      const ok = deviation <= relation.tolerance;

      // un errore già registrato non viene sovrascritto da una conferma
      if (checks[target]?.status === 'error' && ok) continue;

      checks[target] = {
        status: ok ? 'ok' : 'error',
        expected,
        deviation,
        message: ok
          ? `Coerente con ${relation.label} (atteso ${fmt(expected, target)}, scarto ${(deviation * 100).toFixed(1)}%).`
          : `Non torna con ${relation.label}: dagli altri parametri risulterebbe ${fmt(expected, target)}, qui c'è ${fmt(actual, target)} (${(deviation * 100).toFixed(0)}% di scarto).`,
      };
    }
  }

  // i vincoli rigidi hanno la precedenza su qualsiasi conferma
  Object.assign(checks, hardConstraints(input));

  const values = Object.values(checks);
  return {
    checks,
    errorCount: values.filter(c => c.status === 'error').length,
    verifiedCount: values.filter(c => c.status === 'ok').length,
  };
}
