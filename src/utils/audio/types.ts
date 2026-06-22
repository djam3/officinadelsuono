/** Tipi condivisi per i calcolatori audio */

export interface TSParams {
  fs: number;      // Hz
  qts: number;
  qes: number;
  qms: number;
  vas: number;     // litri
  re?: number;     // Ω
  le?: number;     // mH
  sd?: number;     // cm²
  xmax?: number;   // mm (one-way)
  bl?: number;     // T·m
  mms?: number;    // g
  cms?: number;    // mm/N
  pe?: number;     // W (thermal)
  sensitivity?: number; // dB 1W/1m
  impedance?: number;   // Ω nominale
}

export type AlignmentType = 'B4' | 'QB3' | 'C4' | 'SBB4' | 'BESSEL' | 'CUSTOM';

export interface SealedResult {
  vb: number;       // litri
  qtc: number;
  fc: number;       // Hz
  f3: number;       // Hz
  alpha: number;
  peakingDb: number;
}

export interface VentedResult {
  vb: number;       // litri
  fb: number;       // Hz
  f3: number;       // Hz
  alpha: number;
  h: number;
  alignment: AlignmentType;
  portDiameter: number;  // mm
  portLength: number;    // mm
  portCount: number;
  portVelocity: number;  // m/s @ Fb
  minVentArea: number;   // cm² (criterio di Small)
}

export interface CurvePoint { f: number; v: number; }

export interface ResponseCurves {
  spl: CurvePoint[];        // dB relativi (0 = passband)
  excursion: CurvePoint[];  // mm one-way @ potenza data
  impedance: CurvePoint[];  // Ω
  groupDelay: CurvePoint[]; // ms
}
