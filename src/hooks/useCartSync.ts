import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useCartStore, saveCartToFirestore, loadCartFromFirestore } from '../store/cartStore';

/**
 * Sincronizza il carrello con Firestore quando l'utente è loggato.
 * - Al login: carica il carrello da Firestore e lo fonde con quello locale
 * - Quando il carrello cambia (utente loggato): salva su Firestore
 * - Al logout: rimane il carrello locale invariato
 */
export function useCartSync() {
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const currentUserIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false); // evita loop: load → set → save → ...

  // Al login carica il carrello remoto e fondilo con quello locale
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUserIdRef.current = user.uid;
        isSyncingRef.current = true;

        const remoteItems = await loadCartFromFirestore(user.uid);
        const localItems = useCartStore.getState().items;

        if (remoteItems.length > 0) {
          // Fondi: per ogni prodotto remoto, aggiungi se non è già nel carrello locale
          // Se è già presente, tieni la quantità più alta tra le due
          const merged = [...localItems];
          for (const remoteItem of remoteItems) {
            const existing = merged.find((i) => i.id === remoteItem.id);
            if (existing) {
              existing.quantity = Math.max(existing.quantity, remoteItem.quantity);
            } else {
              merged.push(remoteItem);
            }
          }
          setItems(merged);
        }

        isSyncingRef.current = false;
      } else {
        currentUserIdRef.current = null;
      }
    });
    return () => unsub();
  }, [setItems]);

  // Quando il carrello cambia, salva su Firestore se loggato
  useEffect(() => {
    if (isSyncingRef.current) return; // skip durante il caricamento iniziale
    if (!currentUserIdRef.current) return;
    saveCartToFirestore(currentUserIdRef.current, items);
  }, [items]);
}
