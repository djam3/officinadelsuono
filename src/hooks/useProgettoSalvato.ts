/**
 * Il progetto non si perde ricaricando la pagina.
 *
 * Fino a qui un aggiornamento del browser — o una ⓘ aperta per sbaglio nella
 * stessa scheda — buttava via dieci campi compilati a mano. Per uno strumento
 * in cui inserire i dati è metà del lavoro, era il difetto più fastidioso che
 * ci fosse, e non si vedeva finché non capitava.
 *
 * DUE CAUTELE, entrambe imparate sbagliando altrove in questo progetto.
 *
 * La prima: quello che torna dalla memoria non è attendibile. Può venire da
 * una versione precedente del sito, con campi che nel frattempo hanno
 * cambiato nome o non esistono più. Non si usa mai così com'è: si FONDE sopra
 * i valori predefiniti, tenendo solo le chiavi che i predefiniti già
 * conoscono. Un valore avanzato da prima viene semplicemente ignorato invece
 * di arrivare fino al motore di calcolo e farlo cadere.
 *
 * La seconda: leggere e scrivere possono fallire — navigazione privata,
 * memoria piena, impostazioni che bloccano i dati dei siti. Ogni accesso sta
 * dentro un try, e se fallisce lo strumento continua a funzionare senza
 * ricordare niente, che è esattamente quello che faceva prima.
 */

import { useEffect, useState } from 'react';

const VERSIONE = 1;

interface Busta<T> {
  v: number;
  dati: T;
}

/** fonde l'oggetto salvato sopra i predefiniti, chiave per chiave */
function fondi<T extends object>(predefiniti: T, salvato: unknown): T {
  if (!salvato || typeof salvato !== 'object') return predefiniti;
  const s = salvato as Record<string, unknown>;
  const out = { ...predefiniti } as Record<string, unknown>;
  for (const k of Object.keys(predefiniti)) {
    const val = s[k];
    if (val === undefined) continue;
    const pred = (predefiniti as Record<string, unknown>)[k];
    // Nel calcolatore un campo numerico non compilato vale stringa vuota, e il
    // suo predefinito e' '' — quindi `typeof` da solo non basta: un campo che
    // parte vuoto e in cui l'utente ha scritto 27,3 torna dalla memoria come
    // numero, e col solo confronto di tipo veniva scartato in silenzio.
    //
    // Era un difetto serio e invisibile: quattordici campi del progetto
    // partono vuoti - volume e accordo imposti a mano, misure del condotto,
    // dati del radiatore passivo, larghezza e altezza fissate - e tutti
    // tornavano vuoti al ricaricamento, mentre gli altri si ricordavano. Chi
    // lo vedeva poteva solo pensare che il salvataggio funzionasse a caso.
    const ok = typeof val === typeof pred
      || val === ''                                  // campo svuotato
      || (pred === '' && typeof val === 'number');    // campo numerico compilato
    if (ok) out[k] = val;
  }
  return out as T;
}

/**
 * Come `useState`, ma ricorda.
 *
 * Il valore iniziale si legge una volta sola, al montaggio: leggerlo a ogni
 * render costerebbe un accesso al disco per niente.
 */
export function useProgettoSalvato<T extends object>(
  chiave: string, predefiniti: T,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [valore, setValore] = useState<T>(() => {
    try {
      const grezzo = localStorage.getItem(`ods:${chiave}`);
      if (!grezzo) return predefiniti;
      const busta = JSON.parse(grezzo) as Busta<unknown>;
      if (busta?.v !== VERSIONE) return predefiniti;
      return fondi(predefiniti, busta.dati);
    } catch {
      return predefiniti;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`ods:${chiave}`, JSON.stringify({ v: VERSIONE, dati: valore }));
    } catch {
      // niente memoria: si lavora lo stesso, non si ricorda
    }
  }, [chiave, valore]);

  const dimentica = () => {
    try {
      localStorage.removeItem(`ods:${chiave}`);
    } catch {
      // se non si può cancellare, riportare i valori a posto basta comunque
    }
    setValore(predefiniti);
  };

  return [valore, setValore, dimentica];
}
