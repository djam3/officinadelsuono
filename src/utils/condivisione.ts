/**
 * Un progetto dentro un indirizzo.
 *
 * Il calcolatore ricorda quello che hai inserito, ma solo su questo computer:
 * non c'è modo di mandare un progetto a qualcuno. Ed è la cosa che serve di
 * più — «guarda questo, secondo me il condotto è troppo lungo» è metà delle
 * conversazioni su una cassa.
 *
 * NIENTE SERVER. Il progetto viaggia dentro l'indirizzo, non su un database:
 * non c'è niente da tenere acceso, niente da far scadere, niente account da
 * fare, e un collegamento continua a funzionare fra dieci anni finché il sito
 * esiste. In cambio l'indirizzo è lungo, che è un prezzo onesto.
 *
 * COME SI ACCORCIA. Un oggetto in JSON messo in base64 diventa lunghissimo,
 * soprattutto per via dei nomi dei campi ripetuti. Qui i valori vengono
 * scritti in fila, separati, nell'ordine fissato dagli elenchi qui sotto: si
 * perde la leggibilità e si guadagna un indirizzo di un paio di centinaia di
 * caratteri invece di mille.
 *
 * E SI PUÒ CAMBIARE IDEA. La prima cosa nell'indirizzo è il numero di
 * versione. Un collegamento fatto con un formato che non conosciamo più viene
 * rifiutato e basta, senza provare a interpretarlo a caso: meglio dire «questo
 * collegamento è di una versione diversa» che aprire un progetto sbagliato
 * facendolo passare per quello giusto.
 */

const VERSIONE = 1;

/**
 * L'ordine è parte del formato: aggiungere un campo IN FONDO non rompe i
 * collegamenti già in giro (i vecchi semplicemente non ce l'hanno e prendono
 * il predefinito), spostarne uno sì. Quindi si aggiunge sempre in fondo.
 */
export const CAMPI_DRIVER = [
  'fs', 'qts', 'qes', 'qms', 'vas', 're', 'le', 'sd', 'xmax', 'mms', 'cms', 'bl',
  'pe', 'impedance', 'sensitivity',
] as const;

export const CAMPI_CASSA = [
  'enclosure', 'alignment', 'targetQtc', 'customVbL', 'customFbHz', 'portType',
  'portCount', 'portDiameterMm', 'slotWidthMm', 'slotHeightMm', 'bandpassS',
  'bandpassGainDb', 'dipoleFrame', 'wingDepthMm', 'dipoleTargetHz',
] as const;

/**
 * Il quarto gruppo e' arrivato dopo, e lo si vede: c'e' dentro roba di due
 * schede diverse. Ci sta perche' il formato non ha nomi - solo posizioni - e i
 * nomi di queste sette chiavi non si pestano fra loro.
 *
 * Perche' e' servito: senza, un progetto a due driver arrivava a destinazione
 * come un progetto a un driver, e chi lo apriva vedeva un volume sbagliato di
 * meta' senza nessun avviso. E le condizioni di simulazione - potenza,
 * ambiente, tolleranza - decidono meta' dei numeri che si guardano, quindi un
 * collegamento che non le porta mostra un'altra cosa da quella che si e'
 * mandata.
 *
 * NON HA CAMBIATO LA VERSIONE, di proposito. Un collegamento vecchio ha tre
 * gruppi e questi campi restano ai predefiniti; uno nuovo ne ha quattro e una
 * versione vecchia del sito ignora il quarto. Alzare il numero di versione
 * avrebbe fatto rifiutare tutti i collegamenti gia' in giro, per aggiungere
 * roba in fondo - che e' proprio il caso che il formato era fatto per reggere.
 */
export const CAMPI_CONDIZIONI = [
  'count', 'wiring', 'electrical',
  'powerW', 'roomPreset', 'tolCedevolezzaPct', 'tolMotorePct',
] as const;

export const CAMPI_MISURE = [
  'shape', 'wallThicknessMm', 'damping', 'absorber', 'placement',
  'absorberDensityKgM3', 'liningThicknessMm', 'useGoldenRatio', 'fixedWidthMm',
  'fixedHeightMm', 'bracingPercent', 'mountingDepthMm',
] as const;

/**
 * Il formato lavora su dizionari generici: i tipi veri dei tre gruppi vivono
 * nei componenti, e qui servirebbero solo a doverli importare. La garanzia
 * che il risultato sia completo la da' `leggiProgetto`, che parte SEMPRE dai
 * predefiniti e ci scrive sopra solo le chiavi che gia' esistevano.
 */
type Dizionario = Record<string, unknown>;

/** un valore diventa testo: i vuoti restano vuoti, i booleani 1 e 0 */
function scrivi(v: unknown): string {
  if (v === '' || v === undefined || v === null) return '';
  if (typeof v === 'boolean') return v ? '1' : '0';
  return String(v);
}

/** e torna indietro, guardando che TIPO aveva il predefinito */
function leggi(testo: string, predefinito: unknown): unknown {
  if (testo === '') return predefinito === '' ? '' : predefinito;
  if (typeof predefinito === 'boolean') return testo === '1';
  if (typeof predefinito === 'number' || predefinito === '') {
    const n = Number(testo);
    return Number.isFinite(n) ? n : predefinito;
  }
  return testo;
}

/**
 * I separatori: virgola fra i valori, punto e virgola fra i gruppi. Nessuno
 * dei due compare mai dentro un valore — sono numeri, o nomi presi da elenchi
 * chiusi — e nessuno dei due viene riscritto quando l'indirizzo passa da una
 * chat o da un programma di posta.
 */
export function scriviProgetto(
  driver: Dizionario, cassa: Dizionario, misure: Dizionario, condizioni: Dizionario = {},
): string {
  const gruppo = (campi: readonly string[], d: Dizionario) => campi.map(k => scrivi(d[k])).join(',');
  const corpo = [
    gruppo(CAMPI_DRIVER, driver),
    gruppo(CAMPI_CASSA, cassa),
    gruppo(CAMPI_MISURE, misure),
    gruppo(CAMPI_CONDIZIONI, condizioni),
  ].join(';');
  return `${VERSIONE};${corpo}`;
}

export interface ProgettoLetto {
  driver: Dizionario;
  cassa: Dizionario;
  misure: Dizionario;
  condizioni: Dizionario;
}

/** null se il collegamento non è leggibile: chi chiama tiene i suoi valori */
export function leggiProgetto(
  testo: string,
  predDriver: Dizionario, predCassa: Dizionario, predMisure: Dizionario,
  predCondizioni: Dizionario = {},
): ProgettoLetto | null {
  const parti = testo.split(';');
  if (parti.length < 4) return null;
  if (Number(parti[0]) !== VERSIONE) return null;

  const gruppo = (campi: readonly string[], riga: string, pred: Dizionario): Dizionario => {
    const valori = riga.split(',');
    const out: Dizionario = { ...pred };
    campi.forEach((k, i) => {
      if (i < valori.length && k in pred) out[k] = leggi(valori[i], pred[k]);
    });
    return out;
  };

  return {
    driver: gruppo(CAMPI_DRIVER, parti[1], predDriver),
    cassa: gruppo(CAMPI_CASSA, parti[2], predCassa),
    misure: gruppo(CAMPI_MISURE, parti[3], predMisure),
    // un collegamento fatto prima che questo gruppo esistesse non ce l'ha:
    // i predefiniti bastano, e il progetto si apre lo stesso
    condizioni: gruppo(CAMPI_CONDIZIONI, parti[4] ?? '', predCondizioni),
  };
}

/**
 * L'indirizzo completo da copiare.
 *
 * La virgola e il punto e virgola vengono rimessi in chiaro dopo la codifica:
 * sono caratteri leciti dentro un valore di query, e lasciarli codificati
 * costava tre caratteri l'uno — su un progetto pieno sono ottanta caratteri di
 * indirizzo in più, che su un collegamento incollato in chat si vedono.
 */
export function indirizzoProgetto(codice: string): string {
  const base = `${window.location.origin}/progetta-cassa`;
  const q = encodeURIComponent(codice).replace(/%3B/g, ';').replace(/%2C/g, ',');
  return `${base}?p=${q}`;
}
