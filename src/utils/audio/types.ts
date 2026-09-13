/** Tipi condivisi per il motore di calcolo acustico */

// ─── Parametri Thiele-Small ───────────────────────────────────────────────────

export interface TSParams {
  fs: number;        // Hz — risonanza in aria libera
  qts: number;       // Q totale
  qes: number;       // Q elettrico
  qms: number;       // Q meccanico
  vas: number;       // litri — volume d'aria equivalente alla compliance
  re?: number;       // Ω — resistenza DC bobina
  le?: number;       // mH — induttanza bobina
  sd?: number;       // cm² — area radiante effettiva
  xmax?: number;     // mm — escursione lineare (one-way)
  xmech?: number;    // mm — escursione meccanica massima (one-way)
  bl?: number;       // T·m — fattore di forza
  mms?: number;      // g — massa mobile totale
  cms?: number;      // mm/N — compliance sospensioni
  rms?: number;      // kg/s — resistenza meccanica
  pe?: number;       // W — potenza termica continua
  vd?: number;       // cm³ — volume spostato (Sd · Xmax)
  eta0?: number;     // % — efficienza di riferimento
  sensitivity?: number; // dB SPL 1W/1m
  impedance?: number;   // Ω nominali
  dia?: number;      // mm — diametro effettivo del cono
}

/** Campi che l'utente può inserire: tutti opzionali, il motore deriva i mancanti */
export type TSInput = Partial<Record<keyof TSParams, number>>;

// ─── Configurazione altoparlanti multipli ─────────────────────────────────────

export type DriverWiring = 'single' | 'parallel' | 'series' | 'isobaric' | 'push-pull';

export interface DriverConfig {
  count: number;         // numero di altoparlanti
  /** disposizione acustica: come i coni sono montati fra loro */
  wiring: DriverWiring;
  /**
   * Connessione elettrica, quando la disposizione non la implica gia.
   * Un isobarico o un push-pull si possono cablare in serie oppure in
   * parallelo, e la scelta cambia impedenza, BL equivalente e potenza:
   * tenerla insieme alla disposizione rendeva "isobarico in serie"
   * inesprimibile, che e una configurazione del tutto normale.
   */
  electrical?: 'series' | 'parallel';
}

// ─── Tipologie di cassa ───────────────────────────────────────────────────────

export type EnclosureType = 'sealed' | 'vented' | 'passive-radiator' | 'bandpass4' | 'bandpass6';

export type AlignmentType = 'B4' | 'QB3' | 'C4' | 'SBB4' | 'SC4' | 'BESSEL' | 'CUSTOM';

export type PortShape = 'circular' | 'slot';

// ─── Assorbente interno ───────────────────────────────────────────────────────

export type DampingLevel = 'none' | 'minimal' | 'normal' | 'heavy';

export interface DampingSpec {
  qa: number;              // Q delle perdite per assorbimento
  volumeGain: number;      // incremento apparente di Vb (0.20 = +20%)
  label: string;
}

// ─── Risultati ────────────────────────────────────────────────────────────────

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
  spl: CurvePoint[];        // dB (relativi o assoluti se data la sensibilità)
  excursion: CurvePoint[];  // mm one-way alla potenza indicata
  impedance: CurvePoint[];  // Ω
  groupDelay: CurvePoint[]; // ms
  phase: CurvePoint[];      // gradi
  /** solo radiatore passivo: escursione della membrana passiva (mm picco) */
  prExcursion?: CurvePoint[];
}

// ─── Geometria e lista di taglio ──────────────────────────────────────────────

export type BoxShape = 'rectangular' | 'trapezoidal' | 'cylindrical';

export interface BoxDimensions {
  shape: BoxShape;
  /** mm — esterne */
  width: number;
  height: number;
  depth: number;
  /** mm — solo trapezoidale: profondità della faccia posteriore */
  depthRear?: number;
  /** mm — solo cilindrico */
  diameter?: number;
  wallThickness: number; // mm
}

export interface VolumeBreakdown {
  gross: number;        // litri — volume interno lordo
  driverDisp: number;   // litri — ingombro cestello/magnete
  portDisp: number;     // litri — volume occupato dai condotti
  bracingDisp: number;  // litri — rinforzi interni
  net: number;          // litri — volume netto acustico
  effective: number;    // litri — netto + guadagno da assorbente
  /** volume che la parte solida del fonoassorbente sottrae davvero (litri) */
  absorberSolid: number;
}

export interface CutPanel {
  name: string;
  width: number;    // mm
  height: number;   // mm
  thickness: number; // mm
  quantity: number;
  note?: string;
}
