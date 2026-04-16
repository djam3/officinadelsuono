import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set(state => ({
        items: state.items.find(i => i.id === item.id) ? state.items : [...state.items, item]
      })),
      removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),
      toggleItem: (item) => {
        if (get().isInWishlist(item.id)) get().removeItem(item.id);
        else get().addItem(item);
      },
      isInWishlist: (id) => get().items.some(i => i.id === id),
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'wishlist-storage' }
  )
);
