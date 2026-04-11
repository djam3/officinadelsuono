import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  weightKg?: number;
  dimensionsCm?: {
    lunghezza: number;
    larghezza: number;
    altezza: number;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  // Sync helpers (called externally by useCartSync hook)
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),
      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter((i) => i.id !== id) };
        }
        return {
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        };
      }),
      clearCart: () => set({ items: [] }),
      setItems: (items) => set({ items }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Salva il carrello su Firestore per l'utente loggato
export async function saveCartToFirestore(userId: string, items: CartItem[]) {
  try {
    await setDoc(doc(db, 'carts', userId), { items, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Cart sync to Firestore failed:', err);
  }
}

// Carica il carrello da Firestore e lo fonde con quello locale
export async function loadCartFromFirestore(userId: string): Promise<CartItem[]> {
  try {
    const snap = await getDoc(doc(db, 'carts', userId));
    if (snap.exists()) {
      return snap.data().items as CartItem[];
    }
  } catch (err) {
    console.warn('Cart load from Firestore failed:', err);
  }
  return [];
}
