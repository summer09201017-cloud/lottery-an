import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LotteryItem } from '../engine/RandomEngine';

export interface PrizeTier {
  id: string;
  name: string;
  count: number;
  color: string;
  done?: boolean;
}

export interface NamedList {
  id: string;
  name: string;
  items: LotteryItem[];
  prizeTiers: PrizeTier[];
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  name: string;
  date: string;
  prizeTier?: string;
  fairnessCode?: string;
}

export type ThemeKey =
  | 'default'
  | 'sakura'
  | 'casino'
  | 'temple'
  | 'party'
  | 'christmas'
  | 'newyear'
  | 'halloween';

interface AppState {
  // List + history
  items: LotteryItem[];
  history: HistoryEntry[];

  // Prize tiers (年會分輪)
  prizeTiers: PrizeTier[];
  activePrizeTierId: string | null;

  // Named lists (多名單)
  savedLists: NamedList[];
  currentListName: string;

  // Mode + visuals
  mode: 'marquee' | 'wheel' | 'slot' | 'gacha';
  theme: ThemeKey;

  // Settings
  settings: {
    soundEnabled: boolean;
    autoExclude: boolean;
    drawCount: number;            // 一次抽幾位 (Top N)
    countdownEnabled: boolean;    // 3-2-1 倒數
    confirmBeforeDraw: boolean;   // 抽獎前確認
    fullscreenOnDraw: boolean;    // 抽獎時全螢幕
    congratsTemplate: string;     // 客製金句 e.g. "恭喜 {name} 獲得 {prize}"
    fairnessMode: boolean;        // 顯示 SHA-256 公正碼
  };

  // Secret / rigged controls
  blacklist: string[];            // 不能中獎的 item id
  forcedWinnerId: string | null;  // 必中

  // Setters
  setItems: (items: LotteryItem[]) => void;
  addHistory: (entries: HistoryEntry[]) => void;
  setMode: (mode: AppState['mode']) => void;
  setTheme: (theme: ThemeKey) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  clearHistory: () => void;

  // Prize tiers
  setPrizeTiers: (tiers: PrizeTier[]) => void;
  setActivePrizeTier: (id: string | null) => void;
  markTierDone: (id: string) => void;
  resetTiers: () => void;

  // Named lists
  saveCurrentAsList: (name: string) => void;
  loadList: (id: string) => void;
  deleteList: (id: string) => void;

  // Secret
  toggleBlacklist: (itemId: string) => void;
  setForcedWinner: (id: string | null) => void;
  clearSecret: () => void;
}

const TIER_COLORS = ['#fbbf24', '#94a3b8', '#fb923c', '#a3e635', '#22d3ee', '#f472b6'];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      items: [],
      history: [],
      prizeTiers: [],
      activePrizeTierId: null,
      savedLists: [],
      currentListName: '未命名名單',
      mode: 'marquee',
      theme: 'default',
      settings: {
        soundEnabled: true,
        autoExclude: true,
        drawCount: 1,
        countdownEnabled: false,
        confirmBeforeDraw: false,
        fullscreenOnDraw: false,
        congratsTemplate: '🎉 恭喜中獎：{name} 🎉',
        fairnessMode: false,
      },
      blacklist: [],
      forcedWinnerId: null,

      setItems: (items) => set({ items }),

      addHistory: (entries) =>
        set((state) => {
          const newHistory = [...entries, ...state.history];
          if (state.settings.autoExclude) {
            const winnerIds = new Set(entries.map((e) => e.id));
            return {
              history: newHistory,
              items: state.items.filter((i) => !winnerIds.has(i.id)),
            };
          }
          return { history: newHistory };
        }),

      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      clearHistory: () => set({ history: [] }),

      setPrizeTiers: (prizeTiers) => set({ prizeTiers }),
      setActivePrizeTier: (id) => set({ activePrizeTierId: id }),
      markTierDone: (id) =>
        set((state) => ({
          prizeTiers: state.prizeTiers.map((t) =>
            t.id === id ? { ...t, done: true } : t
          ),
        })),
      resetTiers: () =>
        set((state) => ({
          prizeTiers: state.prizeTiers.map((t) => ({ ...t, done: false })),
          activePrizeTierId: null,
        })),

      saveCurrentAsList: (name) =>
        set((state) => {
          const newList: NamedList = {
            id: crypto.randomUUID(),
            name,
            items: state.items,
            prizeTiers: state.prizeTiers,
            updatedAt: new Date().toISOString(),
          };
          return {
            savedLists: [newList, ...state.savedLists.filter((l) => l.name !== name)],
            currentListName: name,
          };
        }),

      loadList: (id) =>
        set((state) => {
          const list = state.savedLists.find((l) => l.id === id);
          if (!list) return {};
          return {
            items: list.items,
            prizeTiers: list.prizeTiers,
            currentListName: list.name,
            history: [],
            blacklist: [],
            forcedWinnerId: null,
            activePrizeTierId: null,
          };
        }),

      deleteList: (id) =>
        set((state) => ({
          savedLists: state.savedLists.filter((l) => l.id !== id),
        })),

      toggleBlacklist: (itemId) =>
        set((state) => ({
          blacklist: state.blacklist.includes(itemId)
            ? state.blacklist.filter((id) => id !== itemId)
            : [...state.blacklist, itemId],
        })),

      setForcedWinner: (id) => set({ forcedWinnerId: id }),
      clearSecret: () => set({ blacklist: [], forcedWinnerId: null }),
    }),
    {
      name: 'lottery-storage',
      version: 2,
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 2) {
          persisted.prizeTiers = persisted.prizeTiers ?? [];
          persisted.activePrizeTierId = persisted.activePrizeTierId ?? null;
          persisted.savedLists = persisted.savedLists ?? [];
          persisted.currentListName = persisted.currentListName ?? '未命名名單';
          persisted.blacklist = persisted.blacklist ?? [];
          persisted.forcedWinnerId = persisted.forcedWinnerId ?? null;
          persisted.settings = {
            soundEnabled: true,
            autoExclude: true,
            drawCount: 1,
            countdownEnabled: false,
            confirmBeforeDraw: false,
            fullscreenOnDraw: false,
            congratsTemplate: '🎉 恭喜中獎：{name} 🎉',
            fairnessMode: false,
            ...persisted.settings,
          };
          // History entries: ensure shape
          persisted.history = (persisted.history ?? []).map((h: any) => ({
            id: h.id,
            name: h.name,
            date: h.date,
            prizeTier: h.prizeTier,
            fairnessCode: h.fairnessCode,
          }));
        }
        return persisted;
      },
    }
  )
);

export const TIER_PALETTE = TIER_COLORS;
