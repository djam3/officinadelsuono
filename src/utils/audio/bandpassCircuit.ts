/**
 * Bandpass 4° e 6° ordine: modello dal circuito equivalente acustico.
 *
 * Fino a qui le curve del bandpass erano disegnate, non calcolate: una campana
 * a Q costante con il Q scelto a mano (1.2 per il sesto ordine) e nessun
 * circuito sotto. Con una forma fittata non si può dire niente di vero
 * sull'escursione del cono né sull'impedenza, perché quelle grandezze non
 * escono dalla curva di pressione: escono dal circuito.
 *
 * La maglia è la stessa del radiatore passivo — il generatore di pressione
 * spinge il diaframma, e in serie stanno i carichi che le camere gli oppongono
 * — ma il driver qui non irradia mai direttamente: sta chiuso fra le due
 * camere, e quello che si sente esce dai condotti.
 *
 * QUARTO ORDINE (single reflex). Camera posteriore SIGILLATA, camera anteriore
 * accordata. La camera posteriore è solo una molla in più sul diaframma,
 * quindi la sua cedevolezza entra in serie nella maglia; la camera anteriore è
 * un risonatore in parallelo e l'uscita è la portata del suo condotto.
 *
 * SESTO ORDINE (double reflex). Entrambe le camere accordate: il driver ha un
 * risonatore per lato e irradiano tutti e due i condotti. La portata di quello
 * posteriore va SOTTRATTA, perché quando il diaframma avanza comprime la
 * camera anteriore e rarefà quella posteriore: i due condotti soffiano in
 * opposizione. È la stessa convenzione con cui il reflex dà driver meno
 * condotto, quella che nel radiatore passivo ha riprodotto esattamente sia il
 * reflex sia la cassa chiusa.
 *
 * Verifiche possibili proprio perché è un circuito e non una campana:
 *   - chiudendo il condotto posteriore il sesto ordine deve ridursi al quarto;
 *   - annullando camera e condotto anteriori il quarto deve ridursi alla cassa
 *     chiusa del solo volume posteriore;
 *   - i fianchi devono valere 12 dB/ottava nel quarto ordine e 18 nel sesto.
 */

import { airDensity, speedOfSound, logFreqGrid, TWO_PI } from './constants';
import { abs, add, arg, c, div, inv, mul, type Cx } from './circuit';
import type { TSParams, CurvePoint } from './types';

export interface BandpassInput {
  ts: TSParams;
  /** camera posteriore (litri) */
  vrL: number;
  /** camera anteriore (litri) */
  vfL: number;
  /** accordo della camera anteriore (Hz) */
  fbFrontHz: number;
  /** accordo della camera posteriore (Hz) — solo sesto ordine */
  fbRearHz?: number;
  /** area del condotto anteriore (cm²) */
  portFrontCm2: number;
  /** area del condotto posteriore (cm²) — solo sesto ordine */
  portRearCm2?: number;
  ql?: number;
  powerW?: number;
  fMin?: number;
  fMax?: number;
  points?: number;
  tempC?: number;
}

export interface BandpassResponse {
  /** dB normalizzati sul picco, come le altre curve del motore */
  spl: CurvePoint[];
  /** escursione del cono (mm picco) */
  excursion: CurvePoint[];
  impedance: CurvePoint[];
  phase: CurvePoint[];
  groupDelay: CurvePoint[];
  /** velocità dell'aria nel condotto anteriore (m/s) */
  portFrontVelocity: CurvePoint[];
  /** velocità dell'aria nel condotto posteriore (m/s) — solo sesto ordine */
  portRearVelocity?: CurvePoint[];
  /** guadagno in banda rispetto al riferimento del driver (dB) */
  passbandGainDb: number;
  /** estremi a −3 dB dal picco */
  fLowHz: number;
  fHighHz: number;
}

interface BPConst {
  cas: number; mas: number; rat: number; ras: number;
  car: number; caf: number;
  maf: number; ralf: number;
  mar: number | null; ralr: number | null;
  pg: number; sd: number; re: number; bl: number;
}

function bpConstants(input: BandpassInput, order: 4 | 6): BPConst {
  const { ts, vrL, vfL, tempC = 20 } = input;
  const rhoC2 = airDensity(tempC) * Math.pow(speedOfSound(tempC), 2);

  const cas = ts.vas / 1000 / rhoC2;
  const ws = TWO_PI * ts.fs;
  const mas = 1 / (ws * ws * cas);
  const zc = Math.sqrt(mas / cas);
  const qms = ts.qms ?? ts.qts * 10;

  const car = Math.max(vrL, 1e-6) / 1000 / rhoC2;
  const caf = Math.max(vfL, 1e-9) / 1000 / rhoC2;
  const wf = TWO_PI * input.fbFrontHz;
  const maf = 1 / (wf * wf * caf);
  const ql = input.ql ?? 7;
  const ralf = ql * Math.sqrt(maf / caf);

  let mar: number | null = null;
  let ralr: number | null = null;
  if (order === 6 && input.fbRearHz) {
    const wr = TWO_PI * input.fbRearHz;
    mar = 1 / (wr * wr * car);
    ralr = ql * Math.sqrt(mar / car);
  }

  const sd = (ts.sd ?? 500) / 1e4;
  const re = ts.re ?? (ts.impedance ?? 8) * 0.85;
  const bl = ts.bl ?? 0;
  const vrms = Math.sqrt((input.powerW ?? 100) * re);
  const pg = bl > 0 ? (bl * vrms) / (re * sd) : 1;

  return { cas, mas, rat: zc / ts.qts, ras: zc / qms, car, caf, maf, ralf, mar, ralr, pg, sd, re, bl };
}

interface BPNode { p: Cx; ud: Cx; upF: Cx; upR: Cx; zMech: Cx; }

function bpNode(f: number, k: BPConst, order: 4 | 6): BPNode {
  const w = TWO_PI * f;
  const s = c(0, w);

  const yFront = add(add(mul(s, c(k.caf)), c(1 / k.ralf)), inv(mul(s, c(k.maf))));
  const zFront = inv(yFront);

  let zRear: Cx;
  let yRear: Cx | null = null;
  if (order === 6 && k.mar !== null && k.ralr !== null) {
    yRear = add(add(mul(s, c(k.car)), c(1 / k.ralr)), inv(mul(s, c(k.mar))));
    zRear = inv(yRear);
  } else {
    // camera posteriore sigillata: resta solo la sua cedevolezza, in serie
    zRear = inv(mul(s, c(k.car)));
  }

  const zDrvTot = add(add(c(k.rat), mul(s, c(k.mas))), inv(mul(s, c(k.cas))));
  // per l'impedenza elettrica serve la maglia SENZA lo smorzamento elettrico,
  // altrimenti si conterebbe due volte lo stesso effetto
  const zDrvMech = add(add(c(k.ras), mul(s, c(k.mas))), inv(mul(s, c(k.cas))));

  const ud = div(c(k.pg), add(add(zDrvTot, zRear), zFront));
  const upF = mul(ud, div(inv(mul(s, c(k.maf))), yFront));
  const upR = yRear !== null && k.mar !== null
    ? mul(ud, div(inv(mul(s, c(k.mar))), yRear))
    : c(0);

  const u0: Cx = { re: upF.re - upR.re, im: upF.im - upR.im };
  return { p: mul(c(0, w), u0), ud, upF, upR, zMech: add(add(zDrvMech, zRear), zFront) };
}

export function computeBandpassResponse(input: BandpassInput, order: 4 | 6): BandpassResponse {
  const k = bpConstants(input, order);
  const grid = logFreqGrid(input.fMin ?? 10, input.fMax ?? 1000, input.points ?? 400);
  const le = (input.ts.le ?? 0.5) / 1000;
  const spF = input.portFrontCm2 / 1e4;
  const spR = (input.portRearCm2 ?? input.portFrontCm2) / 1e4;

  // stesso riferimento usato per le altre casse: il driver controllato dalla
  // massa. Serve a misurare il guadagno vero del bandpass, che è uno dei
  // motivi per cui lo si costruisce.
  const reference = k.pg / k.mas;

  const raw = grid.map(f => {
    const w = TWO_PI * f;
    const n = bpNode(f, k, order);
    const zMot = k.bl > 0 ? (k.bl * k.bl) / (k.sd * k.sd * abs(n.zMech)) : 0;
    return {
      f,
      mag: abs(n.p) / reference,
      ph: (arg(n.p) * 180) / Math.PI,
      xd: k.bl > 0 ? (abs(n.ud) / (w * k.sd)) * 1000 * Math.SQRT2 : 0,
      vF: (abs(n.upF) / spF) * Math.SQRT2,
      vR: (abs(n.upR) / spR) * Math.SQRT2,
      z: k.re + zMot + w * le,
    };
  });

  // il bandpass non ha un asintoto piatto: la curva si normalizza sul picco,
  // come già facevano le stime, ma il guadagno reale resta disponibile a parte
  const peak = Math.max(...raw.map(r => r.mag), 1e-12);
  const spl = raw.map(r => ({ f: r.f, v: 20 * Math.log10(Math.max(r.mag / peak, 1e-9)) }));
  const iPeak = raw.findIndex(r => r.mag === peak);

  const cross = (dir: 1 | -1): number => {
    for (let i = iPeak; i > 0 && i < spl.length - 1; i += dir) {
      const a = spl[i];
      const b = spl[i + dir];
      if (a.v >= -3 && b.v < -3) return a.f + ((-3 - a.v) / (b.v - a.v)) * (b.f - a.f);
    }
    return dir === -1 ? spl[0].f : spl[spl.length - 1].f;
  };

  const groupDelay = grid.map(f => {
    const df = f * 0.01;
    let d = arg(bpNode(f + df, k, order).p) - arg(bpNode(f - df, k, order).p);
    while (d > Math.PI) d -= TWO_PI;
    while (d < -Math.PI) d += TWO_PI;
    return { f, v: Math.max(0, (-d / (TWO_PI * 2 * df)) * 1000) };
  });

  return {
    spl,
    excursion: raw.map(r => ({ f: r.f, v: r.xd })),
    impedance: raw.map(r => ({ f: r.f, v: r.z })),
    phase: raw.map(r => ({ f: r.f, v: r.ph })),
    groupDelay,
    portFrontVelocity: raw.map(r => ({ f: r.f, v: r.vF })),
    portRearVelocity: order === 6 ? raw.map(r => ({ f: r.f, v: r.vR })) : undefined,
    passbandGainDb: 20 * Math.log10(peak),
    fLowHz: cross(-1),
    fHighHz: cross(1),
  };
}
