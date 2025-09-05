import { create } from "zustand";

export type NotificationItem = {
  id: string;
  type: "sale" | "stock";
  message: string;
  createdAt: number;
  read: boolean;
};

type NotifStore = {
  list: NotificationItem[];
  unread: number;
  add: (type: NotificationItem["type"], message: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const nowId = () => `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

export const useNotifications = create<NotifStore>((set) => ({
  list: [],
  unread: 0,
  add: (type, message) =>
    set((s) => {
      const n: NotificationItem = {
        id: nowId(),
        type,
        message,
        createdAt: Date.now(),
        read: false,
      };
      return { list: [n, ...s.list], unread: s.unread + 1 };
    }),
  markAllRead: () =>
    set((s) => ({
      list: s.list.map((n) => ({ ...n, read: true })),
      unread: 0,
    })),
  clear: () => set({ list: [], unread: 0 }),
}));
