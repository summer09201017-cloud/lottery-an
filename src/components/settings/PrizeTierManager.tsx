import { useState } from 'react';
import { useAppStore, TIER_PALETTE } from '../../store/useAppStore';
import type { PrizeTier } from '../../store/useAppStore';
import { Trophy, Plus, X, RotateCcw, Check } from 'lucide-react';
import { clsx } from 'clsx';

export function PrizeTierManager() {
  const {
    prizeTiers,
    setPrizeTiers,
    activePrizeTierId,
    setActivePrizeTier,
    resetTiers,
    settings,
    updateSettings,
  } = useAppStore();
  const [newName, setNewName] = useState('');
  const [newCount, setNewCount] = useState(1);

  const addTier = () => {
    if (!newName.trim()) return;
    const tier: PrizeTier = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      count: Math.max(1, newCount),
      color: TIER_PALETTE[prizeTiers.length % TIER_PALETTE.length],
    };
    setPrizeTiers([...prizeTiers, tier]);
    setNewName('');
    setNewCount(1);
  };

  const removeTier = (id: string) => {
    setPrizeTiers(prizeTiers.filter((t) => t.id !== id));
    if (activePrizeTierId === id) setActivePrizeTier(null);
  };

  const togglePresetMode = () => {
    if (prizeTiers.length === 0) {
      setPrizeTiers([
        { id: crypto.randomUUID(), name: '頭獎', count: 1, color: TIER_PALETTE[0] },
        { id: crypto.randomUUID(), name: '二獎', count: 3, color: TIER_PALETTE[1] },
        { id: crypto.randomUUID(), name: '三獎', count: 5, color: TIER_PALETTE[2] },
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Trophy className="w-4 h-4" /> 獎項分輪
      </label>

      {/* Draw count quick set */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/60 border border-gray-700">
        <span className="text-xs text-gray-400">一次抽</span>
        <input
          type="number"
          min={1}
          max={50}
          value={settings.drawCount}
          onChange={(e) =>
            updateSettings({ drawCount: Math.max(1, Math.min(50, +e.target.value || 1)) })
          }
          className="w-14 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm text-center"
        />
        <span className="text-xs text-gray-400">位</span>
        <span className="text-xs text-gray-500 ml-auto">不開獎項時生效</span>
      </div>

      {prizeTiers.length === 0 ? (
        <button
          onClick={togglePresetMode}
          className="px-3 py-2 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-900/20 hover:bg-indigo-900/40 rounded-lg border border-indigo-800/40"
        >
          + 套用預設（頭獎/二獎/三獎）
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {prizeTiers.map((tier) => {
              const isActive = activePrizeTierId === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => !tier.done && setActivePrizeTier(isActive ? null : tier.id)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all',
                    tier.done
                      ? 'bg-gray-800/40 border-gray-700 opacity-50 cursor-default'
                      : isActive
                      ? 'bg-indigo-700/40 border-indigo-500 shadow-lg'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="flex-1 text-sm text-white truncate">{tier.name}</span>
                  <span className="text-xs text-gray-400">×{tier.count}</span>
                  {tier.done && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTier(tier.id);
                    }}
                    className="text-gray-500 hover:text-red-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-1 mt-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTier()}
              placeholder="獎項名稱"
              className="flex-1 px-2 py-1.5 rounded bg-gray-900 border border-gray-700 text-white text-xs"
            />
            <input
              type="number"
              min={1}
              value={newCount}
              onChange={(e) => setNewCount(+e.target.value)}
              className="w-14 px-2 py-1.5 rounded bg-gray-900 border border-gray-700 text-white text-xs text-center"
            />
            <button
              onClick={addTier}
              className="px-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={resetTiers}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 mt-1 flex items-center gap-1 self-end"
          >
            <RotateCcw className="w-3 h-3" /> 重置進度
          </button>
        </>
      )}
    </div>
  );
}
