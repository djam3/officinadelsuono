/**
 * Radiatore passivo: modello dal circuito equivalente acustico.
 *
 * Il radiatore passivo NON è un reflex. Il condotto è una massa d'aria pura,
 * il radiatore è una massa CON la propria sospensione, e quella compliance in
 * più cambia la funzione di trasferimento: aggiunge una coppia di zeri fuori
 * dall'origine, cioè un notch, e sotto il notch la pendenza torna a quella di
 * una cassa chiusa perché il radiatore si irrigidisce e smette di muoversi.
 * Simularlo con il modello del reflex — come faceva il motore fino a qui —
 * cancellava proprio le due cose che lo distinguono.
 *
 * Small ha pubblicato l'analisi completa in "Passive-Radiator Loudspeaker
 * Systems Part I: Analysis" (JAES 22(8), 1974), ma invece di trascriverne il
 * polinomio qui il sistema si valuta direttamente sul circuito equivalente,
 * che è formulazione standard (Beranek, Small) e si presta a verifiche che un
 * polinomio copiato non consente. I casi limite sono tutti controllabili:
 *
 *   - compliance del radiatore → ∞ (sospensione assente) ⇒ deve tornare
 *     ESATTAMENTE il reflex di quarto ordine già verificato nel motore;
 *   - compliance del radiatore → 0 (membrana bloccata) ⇒ deve tornare la
 *     cassa chiusa di secondo ordine;
 *   - il notch deve cadere alla risonanza in aria libera del radiatore.
 *
 * Analogia di impedenza acustica. Il generatore di pressione equivalente
 * spinge la maglia del driver; in parallelo, verso massa, stanno la compliance
 * della cassa, la resistenza di fuga e il ramo del radiatore:
 *
 *      Z_AD = R_AT + s·M_AS + 1/(s·C_AS)        maglia del driver
 *      Z_AP = R_AP + s·M_AP + 1/(s·C_AP)        ramo del radiatore
 *      Y    = s·C_AB + 1/R_AL + 1/Z_AP          nodo interno alla cassa
 *
 * La portata che esce dalla cassa è quella del driver meno quella che il
 * radiatore assorbe, e si annulla dove Z_AP si annulla: da lì il notch.
 */

import { airDensity, speedOfSound, logFreqGrid, TWO_PI } from './constants';
import type { TSParams, CurvePoint } from './types';

// ─── Complessi ────────────────────────────────────────────────────────────────

interface Cx { re: number; im: number; }
const c = (re: number, im = 0): Cx => ({ re, im });
const add = (a: Cx, b: Cx): Cx => ({ re: a.re + b.re, im: a.im + b.im });
const mul = (a: Cx, b: Cx): Cx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const div = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const inv = (a: Cx): Cx => div(c(1), a);
const abs = (a: Cx) => Math.hypot(a.re, a.im);
const arg = (a: Cx) => Math.atan2(a.im, a.re);

// ─── Parametri del circuito ───────────────────────────────────────────────────

export interface PRCircuitInput {
  ts: TSParams;
  /** volume netto della cassa (litri) */
  vbL: number;
  /** accordo del sistema (Hz): risonanza della massa del PR sulle due compliance in serie */
  fbHz: number;
  /** compliance del radiatore espressa come volume equivalente (litri) */
  prVasL: number;
  /** area del radiatore (cm²) */
  prSdCm2: number;
  /** Q meccanico della sospensione del radiatore (profondità del notch) */
  prQms?: number;
  /** perdite della cassa */
  ql?: number;
  powerW?: number;
  fMin?: number;
  fMax?: number;
  points?: number;
  /** dB 1W/1m: se dato, la curva SPL esce in valore assoluto */
  sensitivity?: number;
  tempC?: number;
}

export interface PRCircuit {
  /** massa acustica del radiatore */
  mapAc: number;
  /** compliance acustica della sospensione del radiatore */
  capAc: number;
  /** compliance acustica dell'aria in cassa */
  cabAc: number;
  /** massa mobile TOTALE che il radiatore deve avere (g) */
  prTotalMassG: number;
  /** risonanza in aria libera del radiatore = frequenza del notch (Hz) */
  fpHz: number;
  /** accordo del sistema (Hz) */
  fbHz: number;
}

/**
 * Costanti del circuito a partire dai parametri di progetto.
 *
 * L'accordo del sistema nasce dalla massa del radiatore su DUE molle in
 * parallelo, la sua sospensione e l'aria della cassa: le rigidezze si sommano,
 * quindi le compliance si combinano in serie. Il notch invece nasce dalla
 * stessa massa sulla SOLA sospensione, perciò cade sempre sotto l'accordo, e
 * il rapporto fra le due frequenze dipende solo dai due volumi:
 *
 *      fp / fb = √( Vb / (Vb + Vap) )
 */
export function prCircuit(input: PRCircuitInput): PRCircuit {
  const { ts, vbL, fbHz, prVasL, prSdCm2, tempC = 20 } = input;
  const rho = airDensity(tempC);
  const c0 = speedOfSound(tempC);
  const rhoC2 = rho * c0 * c0;

  const cabAc = vbL / 1000 / rhoC2;      // m⁵/N
  const capAc = prVasL / 1000 / rhoC2;   // m⁵/N
  const cSer = (cabAc * capAc) / (cabAc + capAc);
  const wb = TWO_PI * fbHz;
  const mapAc = 1 / (wb * wb * cSer);    // kg/m⁴

  const sp = prSdCm2 / 1e4;              // m²
  const prTotalMassG = mapAc * sp * sp * 1000;
  const fpHz = fbHz * Math.sqrt(cabAc / (cabAc + capAc));

  void ts;
  return { mapAc, capAc, cabAc, prTotalMassG, fpHz, fbHz };
}

// ─── Risposta completa ────────────────────────────────────────────────────────

export interface PRResponse {
  spl: CurvePoint[];
  /** escursione del DRIVER (mm picco) */
  excursion: CurvePoint[];
  /** escursione del RADIATORE PASSIVO (mm picco) */
  prExcursion: CurvePoint[];
  impedance: CurvePoint[];
  phase: CurvePoint[];
  groupDelay: CurvePoint[];
  circuit: PRCircuit;
}

/** Grandezze del circuito valutate a una frequenza */
interface PRNode { u0: Cx; ud: Cx; up: Cx; zMech: Cx; }

function evaluate(f: number, k: ReturnType<typeof constants>): PRNode {
  const w = TWO_PI * f;
  const s = c(0, w);

  const zAD = add(add(c(k.rat), mul(s, c(k.mas))), inv(mul(s, c(k.cas))));
  const zADnoEl = add(add(c(k.ras), mul(s, c(k.mas))), inv(mul(s, c(k.cas))));
  const zAP = add(add(c(k.rap), mul(s, c(k.map))), inv(mul(s, c(k.cap))));

  // nodo interno: compliance della cassa, fuga, ramo del radiatore
  const yCab = mul(s, c(k.cab));
  const yTot = add(add(yCab, c(1 / k.ral)), inv(zAP));
  const zPar = inv(yTot);

  const ud = div(c(k.pg), add(zAD, zPar));

  // Quello che esce davvero dalla cassa e' la quota che comprime l'aria: la
  // portata del radiatore torna indietro e quella di fuga e' persa. Contare
  // anche la fuga come irradiata aggiungeva uno zero reale al numeratore e
  // sollevava la risposta in basso: con QL 7 il circuito si scostava di 0.51 dB
  // dal reflex di quarto ordine, mentre con QL infinito coincideva. Nella
  // formulazione di Small la fuga e' una perdita e il numeratore resta s^4.
  const u0 = mul(ud, div(yCab, yTot));
  const up = mul(ud, div(inv(zAP), yTot));

  return { u0, ud, up, zMech: add(zADnoEl, zPar) };
}

function constants(input: PRCircuitInput) {
  const { ts, vbL, prVasL, tempC = 20 } = input;
  const rho = airDensity(tempC);
  const c0 = speedOfSound(tempC);
  const rhoC2 = rho * c0 * c0;

  const cas = ts.vas / 1000 / rhoC2;
  const ws = TWO_PI * ts.fs;
  const mas = 1 / (ws * ws * cas);
  const zc = Math.sqrt(mas / cas); // impedenza caratteristica della maglia driver

  const qes = ts.qes ?? ts.qts;
  const qms = ts.qms ?? ts.qts * 10;
  const rat = zc / ts.qts;   // resistenza totale: elettrica + meccanica
  const ras = zc / qms;      // solo meccanica, serve per l'impedenza elettrica

  const cab = vbL / 1000 / rhoC2;
  const cap = prVasL / 1000 / rhoC2;
  const cSer = (cab * cap) / (cab + cap);
  const wb = TWO_PI * input.fbHz;
  const map = 1 / (wb * wb * cSer);

  const ql = input.ql ?? 7;
  const ral = ql * Math.sqrt(map / cab);
  const prQms = input.prQms ?? 10;
  const rap = Math.sqrt(map / cap) / prQms;

  // generatore di pressione equivalente: p = Bl·e / (Re·Sd)
  const sd = (ts.sd ?? 500) / 1e4;
  const re = ts.re ?? (ts.impedance ?? 8) * 0.85;
  const bl = ts.bl ?? 0;
  const vrms = Math.sqrt((input.powerW ?? 100) * re);
  const pg = bl > 0 ? (bl * vrms) / (re * sd) : 1;

  return { cas, mas, rat, ras, cab, cap, map, ral, rap, pg, sd, re, bl, qes, zc };
}

export function computePRResponse(input: PRCircuitInput): PRResponse {
  const k = constants(input);
  const grid = logFreqGrid(input.fMin ?? 10, input.fMax ?? 20000, input.points ?? 280);
  const circuit = prCircuit(input);
  const rho = airDensity(input.tempC ?? 20);

  // Asintoto di banda passante: ad alta frequenza il radiatore non lavora piu
  // e resta il solo driver controllato dalla massa, p → ρ0·pg/(2πr·M_AS).
  const asymptote = k.pg / k.mas;

  const spl: CurvePoint[] = [];
  const excursion: CurvePoint[] = [];
  const prExcursion: CurvePoint[] = [];
  const impedance: CurvePoint[] = [];
  const phase: CurvePoint[] = [];

  const sp = input.prSdCm2 / 1e4;
  const le = (input.ts.le ?? 0.5) / 1000;
  const sens = input.sensitivity;

  const pressure = (f: number): Cx => {
    const n = evaluate(f, k);
    // p ∝ s·U0 : la pressione irradiata segue l'accelerazione di volume
    return mul(c(0, TWO_PI * f), n.u0);
  };

  for (const f of grid) {
    const w = TWO_PI * f;
    const n = evaluate(f, k);
    const p = mul(c(0, w), n.u0);
    const mag = abs(p) / asymptote;
    spl.push({ f, v: (sens ?? 0) + 20 * Math.log10(Math.max(mag, 1e-9)) });
    phase.push({ f, v: (arg(p) * 180) / Math.PI });

    // escursioni: x = U / (ω·S), valore di picco con tensione RMS
    const xd = k.bl > 0 ? (abs(n.ud) / (w * k.sd)) * 1000 * Math.SQRT2 : 0;
    const xp = k.bl > 0 ? (abs(n.up) / (w * sp)) * 1000 * Math.SQRT2 : 0;
    excursion.push({ f, v: xd });
    prExcursion.push({ f, v: xp });

    // impedenza elettrica: Re + jωLe + Bl²/(Sd²·Z_acustica senza smorzamento elettrico)
    const zMot = k.bl > 0 ? (k.bl * k.bl) / (k.sd * k.sd * abs(n.zMech)) : 0;
    impedance.push({ f, v: k.re + zMot + w * le });
  }

  // ritardo di gruppo dalla fase della pressione
  const groupDelay: CurvePoint[] = grid.map(f => {
    const df = f * 0.01;
    let d = arg(pressure(f + df)) - arg(pressure(f - df));
    while (d > Math.PI) d -= TWO_PI;
    while (d < -Math.PI) d += TWO_PI;
    return { f, v: Math.max(0, (-d / (TWO_PI * 2 * df)) * 1000) };
  });

  void rho;
  return { spl, excursion, prExcursion, impedance, phase, groupDelay, circuit };
}
