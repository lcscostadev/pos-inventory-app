import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  setFromMap: (map: Record<string, { name: string; price: number; qty: number }>) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  setFromMap: (map) =>
    set(() => ({
      items: Object.entries(map)
        .filter(([, v]) => v.qty > 0)
        .map(([id, v]) => ({ id, name: v.name, price: v.price, qty: v.qty })),
    })),
  add: (item, qty = 1) =>
    set((s) => {
      const exists = s.items.find((i) => i.id === item.id);
      if (exists) {
        return {
          items: s.items.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + qty } : i
          ),
        };
      }
      return { items: [...s.items, { ...item, qty }] };
    }),
  setQty: (id, qty) =>
    set((s) => ({
      items:
        qty <= 0 ? s.items.filter((i) => i.id !== id) :
        s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((acc, i) => acc + i.price * i.qty, 0),
  count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
}));