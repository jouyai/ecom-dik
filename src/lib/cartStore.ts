import { create } from "zustand";

interface CartState {
  count: number;
  refresh: boolean;
  setCount: (n: number) => void;
  toggleRefresh: () => void;
}

export const useCart = create<CartState>((set) => ({
  count: 0,
  refresh: false,
  setCount: (n) => set({ count: n }),
  toggleRefresh: () => set((s) => ({ refresh: !s.refresh })),
}));
