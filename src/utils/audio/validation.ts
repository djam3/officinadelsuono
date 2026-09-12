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
  eta0From, sensitivityFrom, sdFromVasCms, mmsFromBl,
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
    // i costruttori pubblicano i Q con due decimali: su 0.25 vale già il 2%
    tolerance: 0.06,
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
    tolerance: 0.04,
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
    tolerance: 0.04,
    solve: (p, t) => {
      if (t === 'vas' && has(p.sd) && has(p.cms)) return vasFrom(p.sd, p.cms);
      if (t === 'cms' && has(p.vas) && has(p.sd)) return cmsFrom(p.vas, p.sd);
      return null;
    },
  },
  {
    label: 'Qms = 2π·Fs·Mms / Rms',
    keys: ['qms', 'fs', 'mms', 'rms'],
    tolerance: 0.05,
    solve: (p, t) => {
      if (t === 'qms' && has(p.fs) && has(p.mms) && has(p.rms)) return qmsFromRms(p.fs, p.mms, p.rms);
      if (t === 'rms' && has(p.fs) && has(p.mms) && has(p.qms)) return rmsFrom(p.fs, p.mms, p.qms);
      return null;
    },
  },
  {
    label: 'Qes = 2π·Fs·Mms·Re / BL²',
    keys: ['qes', 'fs', 'mms', 're', 'bl'],
    tolerance: 0.05,
    solve: (p, t) => {
      if (t === 'qes' && has(p.fs) && has(p.mms) && has(p.re) && has(p.bl)) return qesFromBl(p.fs, p.mms, p.re, p.bl);
      if (t === 'bl' && has(p.fs) && has(p.mms) && has(p.re) && has(p.qes)) return blFrom(p.fs, p.mms, p.re, p.qes);
      return null;
    },
  },
  {
    label: 'Sd = π · (Dia / 2)²',
    keys: ['sd', 'dia'],
    tolerance: 0.06,
    solve: (p, t) => {
      if (t === 'sd' && has(p.dia)) return sdFromDia(p.dia);
      if (t === 'dia' && has(p.sd)) return diaFromSd(p.sd);
      return null;
    },
  },
  {
    label: 'Vd = Sd · Xmax',
    keys: ['vd', 'sd', 'xmax'],
    tolerance: 0.04,
    solve: (p, t) => {
      if (t === 'vd' && has(p.sd) && has(p.xmax)) return vdFrom(p.sd, p.xmax);
      return null;
    },
  },
  {
    label: 'η0 = (4π²/c³) · Fs³ · Vas / Qes',
    keys: ['eta0', 'fs', 'vas', 'qes'],
    tolerance: 0.06,
    solve: (p, t) => {
      if (t === 'eta0' && has(p.fs) && has(p.vas) && has(p.qes)) return eta0From(p.fs, p.vas, p.qes);
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
 * Quanto l'incertezza delle grandezze di partenza si amplifica su quella
 * calcolata: A = √Σ(∂ln target / ∂ln sorgente)², stimata numericamente.
 *
 * Serve perché non tutte le direzioni di una stessa identità sono ugualmente
 * leggibili. Nell'identità dei fattori di merito il Qms entra come differenza
 * di reciproci quasi uguali (1/Qms = 1/Qts − 1/Qes): su un driver con Qts 0.30
 * e Qes 0.31 la seconda decimale, cioè l'ultima che i costruttori pubblicano,
 * si amplifica di trenta volte. Ricavare il Qms in quel modo dava scarti fino
 * al 122% su driver i cui dati sono invece perfettamente coerenti — letti nella
 * direzione giusta lo scarto non superava il 4%. La banda di accettazione va
 * quindi allargata esattamente di quanto l'errore si propaga, altrimenti il
 * controllo accusa i valori giusti.
 */
/** oltre questa amplificazione il valore ricavato non è più informativo */
const AMP_LIMIT = 5;

function amplification(
  sources: (keyof TSParams)[],
  p: TSInput,
  base: number,
  compute: (probe: TSInput) => number | null,
): number {
  const eps = 1e-4;
  let sumSq = 0;
  for (const k of sources) {
    const v0 = p[k];
    if (!positive(v0)) continue;
    const probe: TSInput = { ...p, [k]: v0 * (1 + eps) };
    const v = compute(probe);
    if (v === null || !isFinite(v) || v === 0) continue;
    const dLn = ((v - base) / base) / eps;
    if (isFinite(dLn)) sumSq += dLn * dLn;
  }
  return Math.min(Math.max(1, Math.sqrt(sumSq)), 50);
}

/**
 * Controlli sulla sensibilita, tenuti fuori da RELATIONS perche vanno fatti in
 * dB ASSOLUTI: su una grandezza logaritmica lo scarto relativo non vuol dire
 * niente, e una banda del 2% varrebbe 1.6 dB su 81 dB e 1.9 dB su 96.
 *
 * Le due soglie hanno natura diversa:
 *  - contro un η0 dichiarato la relazione e una DEFINIZIONE, quindi deve
 *    tornare quasi esattamente;
 *  - contro il η0 ricavato da Fs, Vas e Qes resta un identita teorica, ma la
 *    sensibilita pubblicata e una misura, con le sue convenzioni. Sui 32 driver
 *    di libreria presi dai datasheet ufficiali lo scarto vale in media +0.91 dB
 *    (i costruttori dichiarano un filo ottimistico), con deviazione standard
 *    1.12 dB e massimo 3.71 dB: la banda di 5 dB non ne tocca nessuno e
 *    intercetta comunque gli errori grossolani, che sono di tutt altro ordine.
 *
 * Senza questo controllo la contraddizione restava invisibile, perche passa per
 * l η0, che quasi nessuno digita: un set con Fs 20 Hz, Vas 50 L e Qes 0.50
 * dichiarato 96 dB/W/m passava con zero errori, mentre quella combinazione ne
 * rende 81.1.
 */
const SENS_BAND_DEFINITION_DB = 0.5;
const SENS_BAND_THEORETICAL_DB = 5;

function sensitivityChecks(p: TSInput): ValidationMap {
  const out: ValidationMap = {};
  if (!has(p.sensitivity)) return out;

  let expected: number | null = null;
  let band = SENS_BAND_THEORETICAL_DB;
  let via = '';
  if (has(p.eta0)) {
    expected = sensitivityFrom(p.eta0);
    band = SENS_BAND_DEFINITION_DB;
    via = 'dalla definizione 112.16 + 10·log10(η0)';
  } else if (has(p.fs) && has(p.vas) && has(p.qes)) {
    expected = sensitivityFrom(eta0From(p.fs, p.vas, p.qes));
    via = 'da Fs, Vas e Qes';
  }
  if (expected === null || !isFinite(expected)) return out;

  const delta = p.sensitivity - expected;
  const ok = Math.abs(delta) <= band;
  const check: ParamCheck = {
    status: ok ? 'ok' : 'error',
    expected,
    deviation: Math.abs(delta) / Math.abs(expected),
    message: ok
      ? `Compatibile con il rendimento ricavato ${via}: ${expected.toFixed(1)} dB, scarto ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} dB.`
      : `Il rendimento ricavato ${via} vale ${expected.toFixed(1)} dB/W/m, cioè ${Math.abs(delta).toFixed(1)} dB ${delta > 0 ? 'sotto' : 'sopra'} il valore dichiarato. Il rendimento di un altoparlante non si sceglie: lo fissano risonanza, volume equivalente e smorzamento elettrico, e da questi tre non si può ricavare quel numero.`,
  };
  out.sensitivity = check;
  if (has(p.eta0)) out.eta0 = { ...check };
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
      const amp = amplification(relation.keys, others, expected, probe => relation.solve(probe, target));

      // Oltre questa soglia il valore atteso è dominato dagli arrotondamenti
      // altrui e non dice più nulla sul parametro: niente pallino, né verde né
      // rosso. Fingere una verifica sarebbe peggio che ammettere di non sapere.
      if (amp > AMP_LIMIT) continue;

      // banda allargata di quanto l'errore dei dati di partenza si propaga qui
      const band = relation.tolerance * amp;
      const ok = deviation <= band;
      const weak = amp > 2
        ? ` Verifica poco sensibile: gli arrotondamenti degli altri parametri si amplificano di ${amp.toFixed(1)} volte.`
        : '';

      // un errore già registrato non viene sovrascritto da una conferma
      if (checks[target]?.status === 'error' && ok) continue;

      checks[target] = {
        status: ok ? 'ok' : 'error',
        expected,
        deviation,
        message: ok
          ? `Coerente con ${relation.label} (atteso ${fmt(expected, target)}, scarto ${(deviation * 100).toFixed(1)}%).${weak}`
          : `Non torna con ${relation.label}: dagli altri parametri risulterebbe ${fmt(expected, target)}, qui c'è ${fmt(actual, target)} (${(deviation * 100).toFixed(0)}% di scarto contro il ${(band * 100).toFixed(0)}% ammesso).`,
      };
    }
  }

  // chiusure a due strade: contraddizioni che passano per grandezze non digitate
  mergeClosures(checks, runClosures(input));

  // sensibilita: banda in dB assoluti, non in percentuale
  mergeClosures(checks, sensitivityChecks(input));

  // i vincoli rigidi hanno la precedenza su qualsiasi conferma
  Object.assign(checks, hardConstraints(input));

  const values = Object.values(checks);
  return {
    checks,
    errorCount: values.filter(c => c.status === 'error').length,
    verifiedCount: values.filter(c => c.status === 'ok').length,
  };
}

// ─── Chiusure a due strade ────────────────────────────────────────────────────
//
// Le RELATIONS qui sopra hanno un punto cieco: risolvono ogni identità solo dai
// valori DIGITATI, quindi una contraddizione che passa per una grandezza non
// digitata resta invisibile. Il driver di default della pagina ne era l'esempio:
// Vas 60 L con Fs 35 Hz, Mms 95 g e Sd 530 cm² implicava due Cms diversi del 44%,
// ma nessuna relazione poteva accorgersene perché il Cms non era fra i dati
// inseriti e le due strade non si incontravano mai.
//
// Una chiusura elimina l'intermediario: calcola la STESSA grandezza per strade
// indipendenti e le confronta fra loro. Se non coincidono il gruppo di parametri
// è contraddittorio — senza poter dire quale dei valori sia quello sbagliato,
// perciò vengono segnalati tutti.

interface ClosureRoute {
  /** grandezze necessarie: devono essere tutte inserite dall'utente */
  from: (keyof TSParams)[];
  /** come si chiama questa strada nel messaggio */
  via: string;
  compute: (p: TSInput) => number;
}

interface Closure {
  /** grandezza calcolata dalle diverse strade (serve solo per il messaggio) */
  target: keyof TSParams;
  tolerance: number;
  routes: ClosureRoute[];
}

const NAMES: Partial<Record<keyof TSParams, string>> = {
  fs: 'Fs', vas: 'Vas', sd: 'Sd', dia: 'Dia', cms: 'Cms', mms: 'Mms',
  qts: 'Qts', qes: 'Qes', qms: 'Qms', re: 'Re', bl: 'BL', rms: 'Rms',
};

const CLOSURES: Closure[] = [
  {
    // La sospensione ha una sola compliance: quella che si ricava dal volume
    // d'aria equivalente e quella che tiene la massa in risonanza a Fs.
    target: 'cms',
    tolerance: 0.05,
    routes: [
      { from: ['vas', 'sd'], via: 'da Vas e Sd', compute: p => cmsFrom(p.vas!, p.sd!) },
      { from: ['fs', 'mms'], via: 'da Fs e Mms', compute: p => cmsFromMms(p.fs!, p.mms!) },
      { from: ['cms'], via: 'dal valore inserito', compute: p => p.cms! },
    ],
  },
  {
    // La massa mobile vista dalla sospensione e quella vista dal motore.
    target: 'mms',
    tolerance: 0.05,
    routes: [
      { from: ['fs', 'vas', 'sd'], via: 'da Fs, Vas e Sd', compute: p => mmsFrom(p.fs!, cmsFrom(p.vas!, p.sd!)) },
      { from: ['fs', 're', 'qes', 'bl'], via: 'da Fs, Re, Qes e BL', compute: p => mmsFromBl(p.fs!, p.re!, p.qes!, p.bl!) },
      { from: ['mms'], via: 'dal valore inserito', compute: p => p.mms! },
    ],
  },
  {
    // L'area del cono: geometrica contro quella implicata dal Vas dichiarato.
    // È il controllo che smaschera i costruttori car audio che pubblicano come
    // Sd l'area della flangia invece di quella effettiva del cono.
    target: 'sd',
    tolerance: 0.05,
    routes: [
      { from: ['dia'], via: 'dal diametro', compute: p => sdFromDia(p.dia!) },
      { from: ['vas', 'fs', 'mms'], via: 'da Vas, Fs e Mms', compute: p => sdFromVasCms(p.vas!, cmsFromMms(p.fs!, p.mms!)) },
      { from: ['sd'], via: 'dal valore inserito', compute: p => p.sd! },
    ],
  },
  {
    // Lo smorzamento elettrico letto dai fattori di merito e quello che il
    // motore può davvero produrre con quel BL su quella massa.
    target: 'qes',
    tolerance: 0.05,
    routes: [
      { from: ['qms', 'qts'], via: 'da Qms e Qts', compute: p => qesFrom(p.qms!, p.qts!) },
      { from: ['fs', 'mms', 're', 'bl'], via: 'da Fs, Mms, Re e BL', compute: p => qesFromBl(p.fs!, p.mms!, p.re!, p.bl!) },
      { from: ['qes'], via: 'dal valore inserito', compute: p => p.qes! },
    ],
  },
];

const positive = (v: unknown): v is number => typeof v === 'number' && isFinite(v) && v > 0;

/** Elenca i parametri coinvolti in italiano: «Vas, Sd, Fs e Mms» */
function listNames(keys: (keyof TSParams)[]): string {
  const labels = keys.map(k => NAMES[k] ?? String(k));
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

function runClosures(input: TSInput): ValidationMap {
  const out: ValidationMap = {};

  for (const closure of CLOSURES) {
    const live = closure.routes
      .filter(r => r.from.every(k => positive(input[k])))
      .map(r => ({ route: r, value: r.compute(input) }))
      .filter(x => isFinite(x.value) && x.value > 0);

    if (live.length < 2) continue; // con una sola strada non c'è nulla da chiudere

    const sorted = [...live].sort((a, b) => a.value - b.value);
    const lo = sorted[0];
    const hi = sorted[sorted.length - 1];
    const deviation = (hi.value - lo.value) / lo.value;
    // ogni strada porta la propria amplificazione: la banda è la somma in
    // quadratura delle due, perché il confronto eredita entrambe le incertezze
    const ampLo = amplification(lo.route.from, input, lo.value, lo.route.compute);
    const ampHi = amplification(hi.route.from, input, hi.value, hi.route.compute);
    const band = closure.tolerance * Math.hypot(ampLo, ampHi);
    const ok = deviation <= band;

    // tutte le grandezze che entrano nel confronto sono sospette allo stesso modo
    const keys: (keyof TSParams)[] = [];
    for (const x of live) for (const k of x.route.from) if (!keys.includes(k)) keys.push(k);

    // e la grandezza calcolata riceve il verdetto anche se non è stata digitata:
    // è il campo «·calcolato» che la pagina mostra, e quando le strade non
    // coincidono il valore lì dentro è solo quello che la derivazione ha
    // scelto per prima, non un dato verificato
    const flagged: (keyof TSParams)[] = keys.includes(closure.target) ? keys : [...keys, closure.target];

    const name = NAMES[closure.target] ?? String(closure.target);
    const message = ok
      ? `${name} coincide per strade indipendenti (${lo.route.via} ${fmt(lo.value, closure.target)}, ${hi.route.via} ${fmt(hi.value, closure.target)}: ${(deviation * 100).toFixed(1)}% di scarto).`
      : `Contraddizione fra ${listNames(keys)}: ${name} risulta ${fmt(lo.value, closure.target)} ${lo.route.via} ma ${fmt(hi.value, closure.target)} ${hi.route.via} (${(deviation * 100).toFixed(0)}% di scarto contro il ${(band * 100).toFixed(0)}% ammesso). I due valori non possono coesistere sullo stesso altoparlante.`;

    for (const k of flagged) {
      const prev = out[k];
      if (prev?.status === 'error') continue;        // il primo errore, il più diretto, resta
      if (prev?.status === 'ok' && ok) continue;
      out[k] = { status: ok ? 'ok' : 'error', expected: hi.value, deviation, message };
    }
  }

  return out;
}

/** Le chiusure non cancellano mai un errore già trovato dalle relazioni */
function mergeClosures(checks: ValidationMap, closures: ValidationMap): void {
  for (const [key, check] of Object.entries(closures) as [keyof TSParams, ParamCheck][]) {
    if (checks[key]?.status === 'error') continue;
    if (checks[key]?.status === 'ok' && check.status === 'ok') continue; // il messaggio più specifico resta
    checks[key] = check;
  }
}
