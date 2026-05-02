import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Eye, EyeOff, Ban, Crown, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export function SecretControls() {
  const { items, blacklist, forcedWinnerId, toggleBlacklist, setForcedWinner, clearSecret } =
    useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
        title="主持人秘密設定"
      >
        {open ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {open ? '關閉主持人模式' : '主持人模式 🤫'}
      </button>

      {open && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex flex-col gap-3">
          <p className="text-[10px] text-amber-300/80">
            ⚠️ 此區設定僅供主持人安排劇本，請勿讓觀眾看到螢幕。
          </p>

          {/* Forced winner */}
          <div>
            <label className="text-xs font-semibold text-amber-200 flex items-center gap-1 mb-1">
              <Crown className="w-3 h-3" /> 必中（首位中獎者）
            </label>
            <select
              value={forcedWinnerId ?? ''}
              onChange={(e) => setForcedWinner(e.target.value || null)}
              className="w-full px-2 py-1.5 rounded bg-gray-900 border border-amber-800/60 text-white text-xs"
            >
              <option value="">— 不指定 —</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          {/* Blacklist */}
          <div>
            <label className="text-xs font-semibold text-amber-200 flex items-center gap-1 mb-1">
              <Ban className="w-3 h-3" /> 黑名單（永不中獎）
            </label>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {items.length === 0 && (
                <span className="text-[10px] text-gray-500">先加入名單</span>
              )}
              {items.map((i) => {
                const banned = blacklist.includes(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() => toggleBlacklist(i.id)}
                    className={clsx(
                      'px-2 py-0.5 rounded-full text-[10px] border transition-all',
                      banned
                        ? 'bg-red-900/60 border-red-700 text-red-200 line-through'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-700'
                    )}
                  >
                    {i.name}
                  </button>
                );
              })}
            </div>
          </div>

          {(forcedWinnerId || blacklist.length > 0) && (
            <button
              onClick={clearSecret}
              className="text-[10px] text-red-300 hover:text-red-200 flex items-center gap-1 self-end"
            >
              <Trash2 className="w-3 h-3" /> 清除所有秘密設定
            </button>
          )}
        </div>
      )}
    </div>
  );
}
