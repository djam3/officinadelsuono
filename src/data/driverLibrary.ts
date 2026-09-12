/**
 * Libreria altoparlanti — parametri presi UNO A UNO dalle pagine tecniche
 * ufficiali dei costruttori. Ogni voce porta il link al datasheet di origine
 * (campo `datasheet`) per poterla verificare.
 *
 * Regole seguite nella compilazione:
 *  - nessun valore stimato o dedotto: se il costruttore non lo pubblica, il
 *    campo resta assente e il motore lo ricava dalle relazioni Thiele-Small;
 *  - per i driver car audio l'Sd dichiarato è spesso l'area della FLANGIA e
 *    non quella effettiva del cono (il Vas pubblicato è coerente solo con la
 *    seconda): in quei casi l'Sd dichiarato viene omesso e ricavato dal Vas.
 *
 * I parametri restano comunque modificabili nel calcolatore, e la verifica di
 * congruenza segnala in rosso ogni valore che non torna con gli altri.
 */

export type DriverCategory = 'pro' | 'car';

export interface LibraryDriver {
  id: string;
  brand: string;
  model: string;
  /** pollici */
  size: number;
  type: 'subwoofer' | 'woofer' | 'mid-bass' | 'midrange';
  category: DriverCategory;
  impedance: number;
  /** W continui (AES per il pro audio, RMS per il car audio) */
  powerRMS: number;
  /** W di programma o picco, se dichiarati */
  powerPeak?: number;
  /** dB 1W/1m */
  sensitivity: number;
  frequencyRange?: { min: number; max: number };
  thielSmall: {
    fs: number;
    qts: number;
    qes?: number;
    qms?: number;
    /** litri */
    vas?: number;
    /** cm² — omesso quando il costruttore pubblica l'area della flangia */
    sd?: number;
    /** mm, one-way */
    xmax?: number;
    re?: number;
    le?: number;
    /** g */
    mms?: number;
    /** T·m */
    bl?: number;
  };
  mountingDiameter?: number;
  overallDiameter?: number;
  depth?: number;
  weight?: number;
  /** pagina ufficiale da cui provengono i dati */
  datasheet: string;
  /** annotazioni sulla provenienza dei dati */
  note?: string;
}

export const DRIVER_LIBRARY: LibraryDriver[] = [

  // ─── B&C Speakers (Italia) ─────────────────────────────────────────────────
  {
    id: 'bc-21sw152', brand: 'B&C', model: '21SW152', size: 21, type: 'subwoofer', category: 'pro',
    impedance: 4, powerRMS: 2000, powerPeak: 4000, sensitivity: 96,
    frequencyRange: { min: 30, max: 1000 },
    thielSmall: { fs: 32, qts: 0.30, qes: 0.31, qms: 7, vas: 200, sd: 1680, xmax: 15, re: 3.3, le: 1.5, mms: 460, bl: 32.5 },
    overallDiameter: 547, mountingDiameter: 508, depth: 261, weight: 18.5,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/21/4/21SW152',
  },
  {
    id: 'bc-18sw115', brand: 'B&C', model: '18SW115', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1700, powerPeak: 3400, sensitivity: 97,
    frequencyRange: { min: 35, max: 1500 },
    thielSmall: { fs: 32, qts: 0.30, qes: 0.32, qms: 5.6, vas: 187, sd: 1210, xmax: 14, re: 5.3, le: 1.9, mms: 275, bl: 30.3 },
    overallDiameter: 460, mountingDiameter: 425, depth: 242, weight: 11.9,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/18-0/8/18sw115',
  },
  {
    id: 'bc-18ds115', brand: 'B&C', model: '18DS115', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 4, powerRMS: 1700, powerPeak: 3400, sensitivity: 97,
    frequencyRange: { min: 30, max: 500 },
    thielSmall: { fs: 30, qts: 0.17, qes: 0.18, qms: 4.75, vas: 177, sd: 1210, xmax: 16.5, re: 3.3, le: 2.8, mms: 348, bl: 34 },
    overallDiameter: 460, mountingDiameter: 425, depth: 248, weight: 12.55,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/18/4/18DS115',
  },
  {
    id: 'bc-18tbx100', brand: 'B&C', model: '18TBX100', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 4, powerRMS: 1200, powerPeak: 2400, sensitivity: 94,
    frequencyRange: { min: 35, max: 1000 },
    thielSmall: { fs: 30, qts: 0.31, qes: 0.33, qms: 7, vas: 256, sd: 1210, xmax: 9, re: 3.7, le: 1.73, mms: 230, bl: 22 },
    overallDiameter: 460, mountingDiameter: 422, depth: 209, weight: 12.7,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/18/4/18TBX100',
  },
  {
    id: 'bc-15sw115', brand: 'B&C', model: '15SW115', size: 15, type: 'subwoofer', category: 'pro',
    impedance: 4, powerRMS: 1700, powerPeak: 3400, sensitivity: 96,
    frequencyRange: { min: 35, max: 1500 },
    thielSmall: { fs: 34, qts: 0.22, qes: 0.23, qms: 5.8, vas: 105, sd: 855, xmax: 13.5, re: 3.2, le: 1.27, mms: 212, bl: 25.5 },
    overallDiameter: 393, mountingDiameter: 353, depth: 193, weight: 11.1,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/15/4/15SW115',
  },
  {
    id: 'bc-15ndl76', brand: 'B&C', model: '15NDL76', size: 15, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 500, powerPeak: 1000, sensitivity: 99.5,
    frequencyRange: { min: 40, max: 2000 },
    thielSmall: { fs: 37, qts: 0.22, qes: 0.24, qms: 4.5, vas: 195, sd: 855, xmax: 7, re: 5.3, le: 1.5, mms: 96, bl: 22.5 },
    overallDiameter: 393, mountingDiameter: 354, depth: 171, weight: 4.7,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/15/8/15NDL76',
  },
  {
    id: 'bc-12ndl76', brand: 'B&C', model: '12NDL76', size: 12, type: 'woofer', category: 'pro',
    impedance: 4, powerRMS: 400, powerPeak: 800, sensitivity: 100,
    frequencyRange: { min: 50, max: 2000 },
    thielSmall: { fs: 50, qts: 0.19, qes: 0.20, qms: 3.25, vas: 70, sd: 522, xmax: 6, re: 3.1, le: 0.72, mms: 54, bl: 16.5 },
    overallDiameter: 315, mountingDiameter: 283, depth: 141, weight: 3.9,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/12/4/12NDL76',
  },
  {
    id: 'bc-12ps100', brand: 'B&C', model: '12PS100', size: 12, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 700, powerPeak: 1400, sensitivity: 93,
    frequencyRange: { min: 45, max: 1000 },
    thielSmall: { fs: 44, qts: 0.27, qes: 0.29, qms: 3.9, vas: 47, sd: 531, xmax: 8, re: 5.3, le: 2, mms: 106, bl: 22.5 },
    overallDiameter: 319, mountingDiameter: 281, depth: 118, weight: 8.8,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/12/8/12PS100',
  },
  {
    id: 'bc-10ndl64', brand: 'B&C', model: '10NDL64', size: 10, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 250, powerPeak: 500, sensitivity: 97,
    frequencyRange: { min: 50, max: 3000 },
    thielSmall: { fs: 56, qts: 0.26, qes: 0.29, qms: 3.4, vas: 31, sd: 320, xmax: 6, re: 5.7, le: 0.9, mms: 37, bl: 16.2 },
    overallDiameter: 261, mountingDiameter: 230, depth: 113, weight: 2.9,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/10/8/10NDL64',
  },
  {
    id: 'bc-8ndl51', brand: 'B&C', model: '8NDL51', size: 8, type: 'mid-bass', category: 'pro',
    impedance: 4, powerRMS: 200, powerPeak: 400, sensitivity: 94,
    frequencyRange: { min: 75, max: 3000 },
    thielSmall: { fs: 75, qts: 0.57, qes: 0.64, qms: 5.22, vas: 10.1, sd: 220, xmax: 7, re: 2.6, le: 0.15, mms: 27, bl: 7.3 },
    overallDiameter: 225, mountingDiameter: 187, depth: 90, weight: 1.85,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/8/4/8NDL51',
  },
  {
    id: 'bc-6ndl38', brand: 'B&C', model: '6NDL38', size: 6.5, type: 'midrange', category: 'pro',
    impedance: 4, powerRMS: 150, powerPeak: 300, sensitivity: 91,
    frequencyRange: { min: 70, max: 5000 },
    thielSmall: { fs: 69, qts: 0.39, qes: 0.40, qms: 10.05, vas: 7.1, sd: 132, xmax: 6, re: 3.1, le: 0.4, mms: 18, bl: 7.8 },
    overallDiameter: 187, mountingDiameter: 145, depth: 85, weight: 1.2,
    datasheet: 'https://www.bcspeakers.com/en/products/lf-driver/6.5/4/6NDL38',
  },

  // ─── 18 Sound / Eighteen Sound (Italia) ────────────────────────────────────
  {
    id: '18s-21nlw9601', brand: '18 Sound', model: '21NLW9601', size: 21, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1800, powerPeak: 3600, sensitivity: 98,
    frequencyRange: { min: 25, max: 2000 },
    thielSmall: { fs: 37, qts: 0.29, qes: 0.31, qms: 5.5, vas: 175, sd: 1662, xmax: 14, re: 5.9, le: 3.1, mms: 408, bl: 43 },
    overallDiameter: 545, mountingDiameter: 492, depth: 250, weight: 13.5,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/21-0/8/21NLW9601',
  },
  {
    id: '18s-18nlw9601', brand: '18 Sound', model: '18NLW9601', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1800, powerPeak: 3600, sensitivity: 96,
    frequencyRange: { min: 30, max: 2300 },
    thielSmall: { fs: 39, qts: 0.28, qes: 0.30, qms: 5.7, vas: 120, sd: 1130, xmax: 14, re: 4.7, le: 2.19, mms: 275, bl: 31 },
    overallDiameter: 462, mountingDiameter: 416, depth: 236, weight: 12.8,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/18-0/8/18NLW9601',
  },
  {
    id: '18s-18lw2400', brand: '18 Sound', model: '18LW2400', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1200, powerPeak: 2400, sensitivity: 98,
    frequencyRange: { min: 31, max: 2500 },
    thielSmall: { fs: 35, qts: 0.31, qes: 0.32, qms: 7.2, vas: 230, sd: 1225, xmax: 9.5, re: 5, le: 1.35, mms: 192, bl: 25.6 },
    overallDiameter: 462, mountingDiameter: 416, depth: 214, weight: 12.75,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/18-0/8/18LW2400',
  },
  {
    id: '18s-15nlw9500', brand: '18 Sound', model: '15NLW9500', size: 15, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1000, powerPeak: 1400, sensitivity: 96,
    frequencyRange: { min: 42, max: 2000 },
    thielSmall: { fs: 35, qts: 0.32, qes: 0.34, qms: 6.7, vas: 163, sd: 850, xmax: 9, re: 4.9, le: 0.8, mms: 146, bl: 21.6 },
    overallDiameter: 387, mountingDiameter: 353, depth: 177, weight: 7.0,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/15-0/8/15NLW9500',
  },
  {
    id: '18s-15nd930', brand: '18 Sound', model: '15ND930', size: 15, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 500, powerPeak: 800, sensitivity: 98,
    frequencyRange: { min: 40, max: 4100 },
    thielSmall: { fs: 36, qts: 0.22, qes: 0.23, qms: 5.3, vas: 206, sd: 850, xmax: 7.5, re: 5.5, le: 1.61, mms: 101, bl: 23.8 },
    overallDiameter: 387, mountingDiameter: 353, depth: 177, weight: 4.7,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/15-0/8/15ND930',
  },
  {
    id: '18s-12nd930', brand: '18 Sound', model: '12ND930', size: 12, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 500, powerPeak: 800, sensitivity: 98,
    frequencyRange: { min: 46, max: 4500 },
    thielSmall: { fs: 50, qts: 0.21, qes: 0.22, qms: 5.64, vas: 70, sd: 531, xmax: 6.5, re: 5.5, le: 1.65, mms: 57, bl: 21.2 },
    overallDiameter: 315, mountingDiameter: 282, depth: 140, weight: 4.4,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/12-0/8/12ND930',
  },
  {
    id: '18s-12nda520', brand: '18 Sound', model: '12NDA520', size: 12, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 300, powerPeak: 450, sensitivity: 100.5,
    frequencyRange: { min: 55, max: 6000 },
    thielSmall: { fs: 50, qts: 0.27, qes: 0.28, qms: 5.5, vas: 111, sd: 531, xmax: 4, re: 5.2, le: 0.03, mms: 36, bl: 14.4 },
    overallDiameter: 315, mountingDiameter: 282, depth: 125, weight: 3.0,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/12-0/8/12NDA520',
  },
  {
    id: '18s-10nda610', brand: '18 Sound', model: '10NDA610', size: 10, type: 'mid-bass', category: 'pro',
    impedance: 8, powerRMS: 400, powerPeak: 600, sensitivity: 103,
    frequencyRange: { min: 100, max: 6100 },
    thielSmall: { fs: 89, qts: 0.23, qes: 0.24, qms: 7.1, vas: 18, sd: 350, xmax: 2.5, re: 5.5, le: 0.06, mms: 30, bl: 20.3 },
    overallDiameter: 260, mountingDiameter: 232, depth: 96, weight: 3.5,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/10-0/8/10NDA610',
  },
  {
    id: '18s-8nmb420', brand: '18 Sound', model: '8NMB420', size: 8, type: 'mid-bass', category: 'pro',
    impedance: 8, powerRMS: 280, powerPeak: 400, sensitivity: 95,
    frequencyRange: { min: 60, max: 5500 },
    thielSmall: { fs: 61, qts: 0.28, qes: 0.31, qms: 4.0, vas: 33, sd: 230, xmax: 5.8, re: 5.0, le: 0.35, mms: 14.9, bl: 10.0 },
    overallDiameter: 210, mountingDiameter: 186, depth: 99, weight: 1.7,
    datasheet: 'https://www.eighteensound.it/en/products/lf-driver/8-0/8/8NMB420',
  },

  // ─── RCF (Italia) ──────────────────────────────────────────────────────────
  {
    id: 'rcf-l18p400', brand: 'RCF', model: 'L18P400', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1000, powerPeak: 2000, sensitivity: 97.5,
    frequencyRange: { min: 25, max: 1000 },
    thielSmall: { fs: 29, qts: 0.28, qes: 0.29, qms: 7.6, vas: 340, sd: 1200, xmax: 9, re: 5.1, le: 1.2, mms: 200, bl: 24.6 },
    overallDiameter: 465, mountingDiameter: 424, depth: 206, weight: 13.5,
    datasheet: 'https://www.rcf.it/en/products/product-detail/l18p400',
  },
  {
    id: 'rcf-lf18x451', brand: 'RCF', model: 'LF18X451', size: 18, type: 'subwoofer', category: 'pro',
    impedance: 8, powerRMS: 1800, powerPeak: 3600, sensitivity: 97,
    frequencyRange: { min: 30, max: 1000 },
    thielSmall: { fs: 30, qts: 0.28, qes: 0.29, qms: 6.7, vas: 220, sd: 1200, xmax: 14, re: 5.4, le: 1.38, mms: 260, bl: 30.5 },
    overallDiameter: 465, mountingDiameter: 424, depth: 212, weight: 15.2,
    datasheet: 'https://www.rcf.it/en/products/product-detail/lf18x451',
  },
  {
    id: 'rcf-l15p400', brand: 'RCF', model: 'L15P400', size: 15, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 800, powerPeak: 1600, sensitivity: 97,
    frequencyRange: { min: 30, max: 1500 },
    thielSmall: { fs: 36, qts: 0.25, qes: 0.27, qms: 7.5, vas: 160, sd: 900, xmax: 8, re: 4.8, le: 1.2, mms: 150, bl: 24.8 },
    overallDiameter: 393, mountingDiameter: 352, depth: 159, weight: 13.5,
    datasheet: 'https://www.rcf.it/en/products/product-detail/l15p400',
  },
  {
    id: 'rcf-lf12x401', brand: 'RCF', model: 'LF12X401', size: 12, type: 'woofer', category: 'pro',
    impedance: 8, powerRMS: 1000, powerPeak: 2000, sensitivity: 96.5,
    frequencyRange: { min: 45, max: 1500 },
    thielSmall: { fs: 45, qts: 0.27, qes: 0.28, qms: 8.0, vas: 50, sd: 500, xmax: 9, re: 5.2, le: 1.0, mms: 105, bl: 26.1 },
    overallDiameter: 320, mountingDiameter: 282, depth: 134, weight: 11.37,
    datasheet: 'https://www.rcf.it/en/products/product-detail/lf12x401',
  },

  // ─── Car audio ─────────────────────────────────────────────────────────────
  // Sd dichiarato = area della flangia: omesso, il motore lo ricava dal Vas.
  {
    id: 'sundown-sa12v3', brand: 'Sundown Audio', model: 'SA-12 v.3', size: 12, type: 'subwoofer', category: 'car',
    impedance: 4, powerRMS: 1500, sensitivity: 84.5,
    thielSmall: { fs: 35, qts: 0.428, qes: 0.525, qms: 2.308, vas: 22.188, xmax: 22, re: 3.4, mms: 369.75, bl: 22.99 },
    depth: 213,
    datasheet: 'https://sundownaudio.com/products/sa-series-v-3-12-subwoofer',
    note: 'Sd ricavato dal Vas: il costruttore pubblica l\'area della flangia (735 cm²), non quella effettiva del cono.',
  },
  {
    id: 'sundown-sa10v3', brand: 'Sundown Audio', model: 'SA-10 v.3', size: 10, type: 'subwoofer', category: 'car',
    impedance: 2, powerRMS: 1500, sensitivity: 82.5,
    thielSmall: { fs: 36, qts: 0.413, qes: 0.501, qms: 2.341, vas: 10.286, xmax: 22, re: 3.4, mms: 304.45, bl: 22.267 },
    depth: 206,
    datasheet: 'https://sundownaudio.com/products/sa-series-v-3-10-subwoofer',
    note: 'Sd ricavato dal Vas: il costruttore pubblica l\'area della flangia (507 cm²), non quella effettiva del cono.',
  },
  {
    id: 'sundown-sa8v3', brand: 'Sundown Audio', model: 'SA-8 v.3', size: 8, type: 'subwoofer', category: 'car',
    impedance: 4, powerRMS: 600, sensitivity: 82.7,
    thielSmall: { fs: 40, qts: 0.36, qes: 0.392, qms: 4.31, vas: 7.17, xmax: 16, re: 6.0, mms: 126.6, bl: 22.06 },
    depth: 168,
    datasheet: 'https://sundownaudio.com/products/sa-series-v-3-8-500w-car-audio-subwoofer-sub',
    note: 'Sd ricavato dal Vas: il costruttore pubblica l\'area della flangia (345 cm²), non quella effettiva del cono.',
  },
];

export const CATEGORY_LABELS: Record<DriverCategory, string> = {
  pro: 'Pro audio',
  car: 'Car audio',
};
