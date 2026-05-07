import { useState, type ReactNode } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Settings,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  LayoutGrid,
  CircleDashed,
  AlignEndHorizontal,
  Image as ImageIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import { ListInput } from '../settings/ListInput';
import { InstallPWA } from '../settings/InstallPWA';
import { PrizeTierManager } from '../settings/PrizeTierManager';
import { SecretControls } from '../settings/SecretControls';
import { NamedListSwitcher } from '../settings/NamedListSwitcher';
import { StatsPanel } from '../settings/StatsPanel';
import { AdvancedSettings } from '../settings/AdvancedSettings';
import { ThemeBackground } from './ThemeBackground';
import { clsx } from 'clsx';

interface MainLayoutProps {
  children: ReactNode;
}

const THEMES: { id: 'default' | 'sakura' | 'casino' | 'temple' | 'party' | 'christmas' | 'newyear' | 'halloween'; label: string }[] = [
  { id: 'default', label: '預設科技' },
  { id: 'sakura', label: '櫻花落雪' },
  { id: 'casino', label: '賭場風雲' },
  { id: 'temple', label: '廟口抽籤' },
  { id: 'party', label: '賽博尾牙' },
  { id: 'christmas', label: '🎄 聖誕' },
  { id: 'newyear', label: '🧧 新年' },
  { id: 'halloween', label: '🎃 萬聖' },
];

export function MainLayout({ children }: MainLayoutProps) {
  const {
    mode,
    setMode,
    settings,
    updateSettings,
    history,
    clearHistory,
    theme,
    setTheme,
  } = useAppStore();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-gray-950 text-white font-sans overflow-hidden relative">
      {/* Theme background — fixed at root so it's visible on both mobile and desktop, behind everything */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ThemeBackground />
      </div>

      {/* Mobile drawer backdrop — tap to close */}
      {!sidebarHidden && (
        <button
          type="button"
          aria-label="關閉設定面板"
          onClick={() => setSidebarHidden(true)}
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Sidebar / Settings Area
          Mobile: fixed slide-in drawer overlay
          Desktop: in-flow sidebar (relative) */}
      <aside
        className={clsx(
          'bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto transition-all duration-300',
          // Mobile drawer
          'fixed inset-y-0 left-0 z-40 w-full max-w-md shadow-2xl',
          // Desktop sidebar
          'md:relative md:z-20 md:flex-shrink-0 md:max-w-none md:h-screen md:shadow-none',
          sidebarHidden
            ? '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'
            : 'translate-x-0 md:w-80 lg:w-96'
        )}
      >
        <div className="p-6 pb-2 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-2">
            <Shuffle className="text-indigo-400" />
            隨機抽獎機
          </h1>
          {/* Mobile close button — desktop hides this since the toggle in main is enough */}
          <button
            onClick={() => setSidebarHidden(true)}
            className="md:hidden p-2 -mr-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">
          <ListInput />

          <PrizeTierManager />

          <NamedListSwitcher />

          <SecretControls />

          {/* Settings */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Settings className="w-4 h-4" /> 抽獎設定
            </label>

            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm">音效回饋</span>
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
            </button>

            <button
              onClick={() => updateSettings({ autoExclude: !settings.autoExclude })}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm">自動剔除中獎者</span>
              <div
                className={clsx(
                  'w-10 h-5 rounded-full relative transition-colors',
                  settings.autoExclude ? 'bg-indigo-500' : 'bg-gray-600'
                )}
              >
                <div
                  className={clsx(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    settings.autoExclude ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </button>

            <AdvancedSettings />

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> 背景主題
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={clsx(
                      'text-xs p-2 rounded-lg transition-colors border',
                      theme === t.id
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <StatsPanel />

            <InstallPWA />
          </div>

          {/* History */}
          <div className="flex flex-col gap-2 flex-1 min-h-[150px]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-300">中獎紀錄</label>
              <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> 清除
              </button>
            </div>
            <div className="flex-1 bg-gray-800 rounded-lg p-3 overflow-y-auto border border-gray-700 max-h-60">
              {history.length === 0 ? (
                <div className="text-gray-500 text-sm text-center mt-4">尚無紀錄</div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {history.map((h, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-green-400">{h.name}</span>
                        {h.prizeTier && (
                          <span className="text-[10px] text-amber-300">{h.prizeTier}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(h.date).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen z-10 bg-transparent w-full">
        {/* Mobile menu open button — only shows when drawer is closed */}
        {sidebarHidden && (
          <button
            onClick={() => setSidebarHidden(false)}
            className="md:hidden absolute top-4 left-4 z-30 p-2 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="開啟設定面板"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
        )}

        {/* Desktop sidebar toggle */}
        <button
          onClick={() => setSidebarHidden(!sidebarHidden)}
          className="absolute top-4 left-4 z-50 p-2 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors hidden md:flex"
          title={sidebarHidden ? '展開設定面板' : '隱藏設定面板（投影模式）'}
        >
          {sidebarHidden ? (
            <PanelLeftOpen className="w-5 h-5 text-gray-300" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-gray-300" />
          )}
        </button>

        {/* Mode Selector (Header) */}
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-center z-40">
          <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-1 rounded-full flex gap-1 shadow-lg">
            <button
              onClick={() => setMode('marquee')}
              className={clsx(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all',
                mode === 'marquee'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">跑馬燈</span>
            </button>
            <button
              onClick={() => setMode('wheel')}
              className={clsx(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all',
                mode === 'wheel'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <CircleDashed className="w-4 h-4" /> <span className="hidden sm:inline">轉盤</span>
            </button>
            <button
              onClick={() => setMode('slot')}
              className={clsx(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all',
                mode === 'slot'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <AlignEndHorizontal className="w-4 h-4" />{' '}
              <span className="hidden sm:inline">拉霸</span>
            </button>
            <button
              onClick={() => setMode('gacha')}
              className={clsx(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all',
                mode === 'gacha'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <span className="text-base leading-none">✨</span>{' '}
              <span className="hidden sm:inline">抽卡</span>
            </button>
          </div>
        </header>

        <div
          className={clsx(
            'flex-1 flex items-center justify-center pt-20 pb-8 px-4 relative z-10',
            theme === 'default' &&
              'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black'
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
