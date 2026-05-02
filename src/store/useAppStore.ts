import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LotteryItem } from '../engine/RandomEngine';

interface AppState {
  items: LotteryItem[];
  history: { id: string; name: string; date: string }[];
  mode: 'marquee' | 'wheel' | 'slot' | 'gacha';
  theme: 'default' | 'sakura' | 'casino' | 'temple' | 'party';
  settings: {
    soundEnabled: boolean;
    autoExclude: boolean;
  };
  setItems: (items: LotteryItem[]) => void;
  addHistory: (item: LotteryItem) => void;
  setMode: (mode: AppState['mode']) => void;
  setTheme: (theme: AppState['theme']) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      items: [],
      history: [],
      mode: 'marquee',
      theme: 'default',
      settings: {
        soundEnabled: true,
        autoExclude: true,
      },
      setItems: (items) => set({ items }),
      addHistory: (item) =>
        set((state) => {
          const newHistory = [
            { id: item.id, name: item.name, date: new Date().toISOString() },
            ...state.history,
          ];
          
          // If autoExclude is on, remove the item from the pool
          if (state.settings.autoExclude) {
            return {
              history: newHistory,
              items: state.items.filter((i) => i.id !== item.id),
            };
          }
          
          return { history: newHistory };
        }),
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'lottery-storage',
    }
  )
);
