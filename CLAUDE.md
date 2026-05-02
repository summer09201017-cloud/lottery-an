# CLAUDE.md

本檔案提供 Claude Code 在此 repo 工作時所需的快速上下文。

## 專案概覽

「隨機抽獎機」— 純前端 (React + TypeScript + Vite) 的多模式抽獎機 PWA，可離線使用、安裝為手機/桌面 App。針對年會、尾牙、教學、直播等場景設計。

- **Repo**: https://github.com/summer09201017-cloud/lottery-an
- **目錄名**: `跑馬燈抽獎機AN/跑馬燈抽獎機AN`（巢狀同名，是上層的舊版備份）
- **主要分支**: `main`（直接推，無 PR 流程）
- **語言**: 介面與 commit message 用繁體中文，程式碼識別字用英文

## 技術棧

| 類別 | 工具 |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8（已注意：用 Rolldown，`vite-plugin-pwa` 會印 warning 但功能正常） |
| Style | Tailwind CSS 3 + `clsx` + `tailwind-merge` |
| State | Zustand 4（`persist` middleware，`localStorage` key = `lottery-storage`，目前 version = 2） |
| Animation | Framer Motion 11 |
| 視覺特效 | `canvas-confetti`、`navigator.vibrate`、Web Audio API（自製合成音效） |
| Icons | `lucide-react` |
| QR | `qrcode` |
| 截圖匯出 | `html-to-image` |
| PWA | `vite-plugin-pwa`（autoUpdate、Workbox） |

## 常用指令

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc -b && vite build → 產生 dist/
npm run preview  # 預覽 production build
npm run lint     # ESLint（含 react-hooks、react-refresh）
```

> 沒有測試框架。若加測試請先選 Vitest 並更新此檔。

## 核心架構

```
src/
├── App.tsx                 # 入口；解析 ?list= URL 參數載入分享名單
├── main.tsx                # React root
├── engine/
│   └── RandomEngine.ts     # crypto.getRandomValues 真隨機 + drawMultiple + SHA-256 fairnessCode
├── store/
│   └── useAppStore.ts      # Zustand 全域 store（含 v2 migration）
├── hooks/
│   ├── useSoundEffects.ts  # Web Audio 合成 tick / win
│   └── useDrawSession.ts   # ★ 統一抽獎邏輯：分輪/必中/黑名單/紀錄/確認
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx       # 側欄 + 模式切換 header + 投影模式 toggle
│   │   └── ThemeBackground.tsx  # 8 種主題背景動畫
│   ├── modes/
│   │   ├── MarqueeMode.tsx      # 跑馬燈 (格狀跳格高亮)
│   │   ├── WheelMode.tsx        # 轉盤 (SVG slices)
│   │   ├── SlotMode.tsx         # 拉霸 (3 列垂直滾動 + 真三連線判定)
│   │   ├── GachaMode.tsx        # 抽卡 (R/SR/SSR 翻牌)
│   │   ├── CountdownOverlay.tsx # 3-2-1 倒數
│   │   └── ConfirmDialog.tsx    # 抽獎前確認
│   └── settings/
│       ├── ListInput.tsx        # Chip 編輯 + CSV + QR
│       ├── PrizeTierManager.tsx # 獎項分輪
│       ├── NamedListSwitcher.tsx# 多名單儲存切換
│       ├── SecretControls.tsx   # 主持人模式（黑名單 / 必中）
│       ├── StatsPanel.tsx       # 統計圖表 + CSV/PNG 匯出
│       ├── AdvancedSettings.tsx # 倒數/確認/公正碼/金句模板/全螢幕
│       └── InstallPWA.tsx       # 平台偵測 + iOS 加入主畫面教學
```

### Store 形狀（重點欄位）

```ts
{
  items: LotteryItem[]              // { id, name, weight, group? }
  history: HistoryEntry[]           // { id, name, date, prizeTier?, fairnessCode? }
  prizeTiers: PrizeTier[]           // { id, name, count, color, done? }
  activePrizeTierId: string | null
  savedLists: NamedList[]           // 多名單
  blacklist: string[]               // item.id list
  forcedWinnerId: string | null     // 必中
  mode: 'marquee' | 'wheel' | 'slot' | 'gacha'
  theme: 'default' | 'sakura' | 'casino' | 'temple' | 'party' | 'christmas' | 'newyear' | 'halloween'
  settings: {
    soundEnabled, autoExclude, drawCount,
    countdownEnabled, confirmBeforeDraw, fullscreenOnDraw,
    congratsTemplate,           // e.g. "🎉 恭喜中獎：{name} 🎉"
    fairnessMode,               // 顯示 SHA-256 公正碼
  }
}
```

### 關鍵慣例

- **新增抽獎模式時**：在 `components/modes/` 新建檔案，呼叫 `useDrawSession()` 拿到統一介面（`drawWinners`、`recordWinners`、`requestStart`、`formatCongrats`、`pendingConfirm`、`currentTier`、`drawCount`），不要重複實作必中/黑名單/紀錄邏輯。
- **新增背景主題時**：在 `ThemeBackground.tsx` 加新 component + `THEMES` 陣列（`MainLayout.tsx`）+ `ThemeKey` union（`useAppStore.ts`）。
- **store 結構變動**：必須 bump `version` 並補 `migrate`，避免老用戶 localStorage 報錯。
- **隨機性**：一律走 `RandomEngine.getRandom()`（crypto API）。**不要用 `Math.random()`**——抽獎場景公平性是底線。
- **使用者輸入解析**：`ListInput.parseLine` 支援 `名字`、`名字,權重`、`名字,權重,群組`，分隔符接受逗號或 Tab（直接貼 Excel 可用）。
- **i18n**：UI 文案、commit message、PR title 一律繁體中文；程式內識別字（變數/函式/檔案）一律英文。

## PWA / iOS 注意事項

- iOS Safari **不會觸發** `beforeinstallprompt`。`InstallPWA.tsx` 因此採平台偵測 + 圖文教學 modal，不能改回單純依賴 `beforeinstallprompt`。
- iOS 需要 `index.html` 內的 `apple-touch-icon`、`apple-mobile-web-app-capable`、`apple-mobile-web-app-title`，否則加入主畫面後體驗會壞。
- PWA manifest 設定在 `vite.config.ts` 的 `VitePWA({ manifest: ... })`，不在獨立的 `manifest.json`。

## 已知問題 / 暫不處理

- `vite-plugin-pwa` 會印 Rolldown warning（"This plugin assigns to bundle variable"）— 純警告，build 仍成功。已知 vite 8 + 該 plugin 的相容性問題。
- 沒做後端，所以「跨裝置同步抽獎」、「預約時間抽獎」目前無法實作。
- `npm audit` 有 3 個 high vulnerabilities，源自 build-time 套件，非 runtime 風險。

## 常見任務操作慣例

- **改 UI 文案 / 加按鈕**：直接改對應 component；不必加 i18n 抽象層（單語系）。
- **加新「設定開關」**：在 `useAppStore.ts` 的 `settings` 加欄位 + bump migration → 在 `AdvancedSettings.tsx` 加 `<Toggle>` → 在用得到的模式裡讀取。
- **commit 訊息**：繁中、用 conventional prefix（`feat:` `fix:` `refactor:` `docs:`），第一行短摘要、空行後條列細項。
- **不要主動建立 `*.md` 文件**（除非使用者明確要）。本檔案 `CLAUDE.md` 是例外。
- **不要主動 push**：使用者每次會口頭交代「推上 GitHub」才推。push 前必先 `npm run build` 過。

## 部署

目前是純靜態，`dist/` 可丟任何 static host（GitHub Pages / Vercel / Netlify / Cloudflare Pages）。Service Worker 由 `vite-plugin-pwa` 自動產生為 `dist/sw.js` + precache。

如要設定 GitHub Pages：base path 需在 `vite.config.ts` 加 `base: '/lottery-an/'`，目前未設，預設假設根路徑部署。
