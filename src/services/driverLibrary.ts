/**
 * Libreria componenti (driver) — sorgente parametri per i calcolatori.
 * I driver gestiti dall'admin in Firestore (`speaker_drivers`); se la collection
 * è vuota si usa il catalogo integrato come fallback. Lettura pubblica (i calcoli
 * girano lato client), scrittura solo admin.
 */
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { DRIVERS } from '../data/speakerDatabase';
import type { SpeakerDriver } from '../types/speaker';

/** Sottoscrive la lista driver. Restituisce il catalogo integrato se vuoto/errore. */
export function subscribeDrivers(cb: (drivers: SpeakerDriver[], fromDb: boolean) => void) {
  return onSnapshot(
    collection(db, 'speaker_drivers'),
    (snap) => {
      if (snap.empty) { cb(DRIVERS, false); return; }
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SpeakerDriver));
      cb(list, true);
    },
    () => cb(DRIVERS, false)
  );
}

export async function saveDriver(driver: SpeakerDriver): Promise<void> {
  const { id, ...data } = driver;
  await setDoc(doc(db, 'speaker_drivers', id), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteDriver(id: string): Promise<void> {
  await deleteDoc(doc(db, 'speaker_drivers', id));
}

/** Crea un driver vuoto con valori di default sensati */
export function emptyDriver(): SpeakerDriver {
  return {
    id: `drv-${Date.now().toString(36)}`,
    brand: '', model: '', size: 12, type: 'woofer',
    powerRMS: 300, powerPeak: 600, impedance: 8, sensitivity: 90,
    frequencyRange: { min: 40, max: 4000 },
    thielSmall: { fs: 40, qts: 0.4, qes: 0.45, qms: 4, vas: 60, xmax: 6, sd: 510, re: 5.4, mms: 60, bl: 15, le: 1 },
    price: 0, image: '', description: '', recommendedFor: [],
    datasheet: '',
  };
}
