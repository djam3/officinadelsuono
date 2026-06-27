/**
 * Speaker Configurator — Type Definitions
 * Sistema di progettazione casse acustiche personalizzate con AI
 */

// ─── Parametri Thiele-Small ────────────────────────────────────────────────────
export interface ThieleSmallParams {
  fs: number;    // Frequenza di risonanza in free-air (Hz)
  qts: number;   // Q totale del sistema
  qes: number;   // Q elettrico
  qms: number;   // Q meccanico
  vas: number;   // Volume aria equivalente compliance (litri)
  xmax: number;  // Escursione lineare massima (mm)
  sd: number;    // Area radiante effettiva (cm²)
  re: number;    // Resistenza DC bobina (Ohm)
  mms: number;   // Massa mobile totale (g)
  bl: number;    // Prodotto forza (T·m)
  le?: number;   // Induttanza bobina (mH)
  eta0?: number; // Efficienza di riferimento (%)
}

// ─── Driver / Cono Speaker ─────────────────────────────────────────────────────
export type DriverType = 'subwoofer' | 'woofer' | 'midrange' | 'mid-bass' | 'full-range' | 'tweeter' | 'compression-driver' | 'coaxial';
// pollici: woofer/sub 6.5–21; per tweeter/driver a compressione si usano valori
// piccoli (1 / 1.4 / 3) → tipo allargato a number
export type DriverSize = number;

export interface SpeakerDriver {
  id: string;
  brand: string;
  model: string;
  size: DriverSize;            // pollici
  type: DriverType;
  powerRMS: number;            // Watt RMS continui
  powerPeak: number;           // Watt di picco / programma
  impedance: number;           // Ohm nominali (4, 8, 16)
  sensitivity: number;         // dB SPL @ 1W/1m
  frequencyRange: {
    min: number;               // Hz
    max: number;               // Hz
  };
  thielSmall: ThieleSmallParams;
  price: number;               // prezzo acquisto €
  image: string;
  datasheet?: string;          // URL al PDF datasheet
  description: string;
  madeIn?: string;
  recommendedFor: UseCase[];
  magnetType?: string;         // 'Ferrite' | 'Neodimio'
  coneType?: string;           // 'Carta' | 'Kevlar' | 'Polipropilene' | 'Alluminio'
  voiceCoilDiameter?: number;  // mm
  mountingDiameter?: number;   // mm (diametro foro montaggio)
  overallDiameter?: number;    // mm (diametro esterno)
  depth?: number;              // mm (profondità totale)
  weight?: number;             // kg
}

// ─── Amplificatore Classe D (per casse attive) ─────────────────────────────────
export type AmpClass = 'D' | 'AB' | 'H';

export interface Amplifier {
  id: string;
  brand: string;
  model: string;
  classType: AmpClass;
  channels: number;
  powerPerChannel: {           // Watt RMS per canale @ impedenza
    [ohms: string]: number;    // es. "4": 500, "8": 250
  };
  impedanceRange: number[];    // [4, 8] Ohm supportati
  frequencyResponse: {
    min: number;
    max: number;
  };
  thd: number;                 // % distorsione armonica totale
  snr: number;                 // dB rapporto segnale/rumore
  hasDSP: boolean;
  dspFeatures?: string[];      // ['Crossover', 'EQ parametrico', 'Limiter', 'Delay']
  inputs: string[];            // ['XLR', 'Jack 6.3mm', 'RCA', 'Bluetooth', 'USB']
  outputs?: string[];
  dimensions: {
    width: number;             // mm
    height: number;            // mm
    depth: number;             // mm
  };
  weight: number;              // kg
  supplyVoltage: string;       // '230V AC' o '24-48V DC'
  price: number;               // prezzo acquisto €
  image: string;
  description: string;
  madeIn?: string;
  features: string[];
  protections?: string[];      // ['Sovratemperatura', 'Cortocircuito', 'DC offset']
}

// ─── Caso d'Uso ────────────────────────────────────────────────────────────────
export type UseCase =
  | 'dj-club'
  | 'dj-festival'
  | 'band-live'
  | 'pa-events'
  | 'studio-monitor'
  | 'home-hifi'
  | 'karaoke'
  | 'cinema-home'
  | 'subwoofer-dedicato';

export type MusicGenre =
  | 'techno'
  | 'house'
  | 'hip-hop'
  | 'rock'
  | 'metal'
  | 'jazz'
  | 'classica'
  | 'pop'
  | 'reggae'
  | 'drum-and-bass'
  | 'acustica'
  | 'elettronica';

export type Environment = 'indoor-small' | 'indoor-medium' | 'indoor-large' | 'outdoor';

export type BudgetTier = 'economy' | 'mid' | 'premium' | 'ultra';

// ─── Configurazione Utente (input del wizard) ──────────────────────────────────
export interface UserConfiguration {
  useCase: UseCase;
  musicGenres: MusicGenre[];
  environment: Environment;
  budget: BudgetTier;
  quantity: number;            // quante casse (1 = mono, 2 = stereo)
  preferences?: {
    preferredBrands?: string[];
    maxWeight?: number;        // kg
    maxHeight?: number;        // mm
    colorPreference?: string;
    bluetoothRequired?: boolean;
  };
}

// ─── Progetto Cassa (output del calcolo) ───────────────────────────────────────
export type CabinetType = 'sealed' | 'bass-reflex' | 'horn' | 'bandpass' | 'transmission-line';
export type WoodType = 'MDF' | 'MDF-HDF' | 'Betulla Baltica' | 'Multistrato Pioppo' | 'Abete Massello';

export interface PortDesign {
  shape: 'circular' | 'slot';
  diameter?: number;           // mm (per porta circolare)
  slotWidth?: number;          // mm (per porta a fessura)
  slotHeight?: number;         // mm
  length: number;              // mm profondità porta
  count?: number;              // numero di porte identiche (default 1)
  tuningFrequency: number;     // Hz frequenza di accordo
  airVelocity?: number;        // m/s (ideale < 17 m/s)
}

export interface CabinetPanel {
  id: string;
  name: string;                // 'Frontale', 'Posteriore', 'Laterale SX', etc.
  width: number;               // mm
  height: number;              // mm
  thickness: number;           // mm
  quantity: number;
  material: WoodType;
  holes?: PanelHole[];
  notes?: string;              // istruzioni speciali per il falegname
}

export interface PanelHole {
  type: 'driver' | 'port' | 'amplifier' | 'handle' | 'connector' | 'vent';
  shape: 'circle' | 'rectangle' | 'rounded-rect';
  // Per cerchi
  diameter?: number;           // mm
  // Per rettangoli
  width?: number;              // mm
  height?: number;             // mm
  cornerRadius?: number;       // mm
  // Posizione centro dal basso-sinistra del pannello
  x: number;                   // mm
  y: number;                   // mm
  label: string;               // descrizione per il falegname
}

export interface BracingDesign {
  type: 'window' | 'shelf' | 'cross' | 'ring';
  position: number;            // mm dal fondo
  material: WoodType;
  thickness: number;           // mm
  description: string;
}

export interface CabinetDesign {
  type: CabinetType;
  name: string;                // nome descrittivo del progetto
  internalVolume: number;      // litri (volume netto)
  grossVolume: number;         // litri (volume lordo)
  externalDimensions: {
    width: number;             // mm
    height: number;            // mm
    depth: number;             // mm
  };
  woodType: WoodType;
  woodThickness: number;       // mm (18 o 21 tipicamente)
  port?: PortDesign;
  panels: CabinetPanel[];
  bracing: BracingDesign[];
  dampingMaterial: string;     // 'Lana di roccia 40mm' etc.
  dampingCoverage: string;     // 'Pareti laterali e posteriore'
  driverCutout: {
    diameter: number;          // mm
    boltCircle: number;        // mm
    boltCount: number;
    boltSize: string;          // 'M6' etc.
  };
  ampCutout?: {
    width: number;             // mm
    height: number;            // mm
    position: 'rear' | 'rear-bottom';
  };
  handleCutouts?: {
    width: number;
    height: number;
    position: 'sides' | 'top';
  };
  /** Griglia frontale di protezione: misura e fissaggio calcolati */
  grilleSpec?: {
    width: number;             // mm — copre il baffle con margine
    height: number;            // mm
    frameDepthMm: number;      // profondità telaio/sporgenza
    mount: string;             // tipo fissaggio (es. magneti, velcro, viti+gommini)
    fixingPoints: number;      // numero punti di fissaggio
  };
  /** Angolari di protezione (per uso pro / touring / outdoor) */
  cornerProtectors?: {
    needed: boolean;
    count: number;             // tipicamente 8 (uno per spigolo)
    type: string;              // es. 'ABS rinforzato a sfera'
  };
  finish: string;              // 'Vernice nera testurizzata' etc.
  accessories?: {              // opzioni estetiche/funzionali scelte dal cliente
    grille?: boolean;          // griglia metallica frontale
    wheels?: boolean;          // ruote / rotelle
    handles?: boolean;         // maniglie da trasporto
    poleMount?: boolean;       // incasso per asta (pole mount)
    ralColor?: string;         // codice colore RAL personalizzato
  };
  estimatedWeight: number;     // kg (cassa vuota)
  assemblyNotes: string[];     // istruzioni per il falegname
}

// ─── Preventivo e Prezzi ───────────────────────────────────────────────────────
export interface PricingBreakdown {
  driverCost: number;          // costo acquisto driver
  amplifierCost: number;       // costo acquisto amplificatore
  woodCost: number;            // costo stimato legno
  carpenterLabor: number;      // costo manodopera falegname
  hardwareCost: number;        // viti, maniglie, terminali, griglia...
  dampingCost: number;         // materiale fonoassorbente
  finishCost: number;          // verniciatura/rivestimento
  assemblyLabor: number;       // costo assemblaggio OdS (montaggio woofer + ampli)
  subtotal: number;
  margin: number;              // margine OdS (%)
  marginAmount: number;        // margine in €
  totalPerUnit: number;
  quantity: number;
  grandTotal: number;
}

export interface PricingConfig {
  marginPercent: number;       // margine % Officina del Suono (default 30%)
  carpenterRatePerHour: number; // €/ora falegname
  estimatedHoursPerCabinet: number;
  woodPricePerSheet: number;   // prezzo per foglio MDF 244x122cm
  hardwareKitPrice: number;    // prezzo kit ferramenta
  dampingPricePerMeter: number;
  finishPricePerCabinet: number;
  assemblyHours: number;       // ore assemblaggio OdS
  assemblyRatePerHour: number;
}

// ─── Progetto Completo ─────────────────────────────────────────────────────────
export type ProjectStatus =
  | 'configurazione'
  | 'preventivo'
  | 'approvato'
  | 'ordinato'
  | 'in_produzione_legno'
  | 'assemblaggio'
  | 'testing'
  | 'completato'
  | 'consegnato';

export interface SpeakerProject {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  // Configurazione
  userConfig: UserConfiguration;
  // Componenti selezionati
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  // Prezzi
  pricing: PricingBreakdown;
  pricingConfig: PricingConfig;
  // AI
  aiExplanation: string;       // spiegazione AI della scelta
  aiConfidence: number;        // 0-100 confidenza della raccomandazione
  // Stato
  status: ProjectStatus;
  notes?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  completedAt?: string;
}

// ─── AI Recommendation Response ────────────────────────────────────────────────
export interface AIRecommendation {
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  pricing: PricingBreakdown;
  explanation: string;
  alternatives: {
    drivers: SpeakerDriver[];
    amplifiers: Amplifier[];
  };
  confidence: number;
  warnings?: string[];
}

// ─── Richiesta dal Configuratore (lead → admin) ────────────────────────────────
export type ConfiguratorRequestStatus = 'nuovo' | 'preventivato' | 'inviato' | 'chiuso';

export interface ConfiguratorRequest {
  id: string;
  code: string;
  status: ConfiguratorRequestStatus;
  contact: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
  };
  driverId: string;
  driverLabel: string;
  ampId: string;
  ampLabel: string;
  useCase: string;
  quantity: number;
  cabinetName: string;
  createdAt: string;
}

// ─── Wizard State ──────────────────────────────────────────────────────────────
export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardState {
  currentStep: WizardStep;
  userConfig: Partial<UserConfiguration>;
  selectedDriver: SpeakerDriver | null;
  selectedAmplifier: Amplifier | null;
  cabinetDesign: CabinetDesign | null;
  pricing: PricingBreakdown | null;
  aiRecommendation: AIRecommendation | null;
  isLoading: boolean;
  error: string | null;
}
