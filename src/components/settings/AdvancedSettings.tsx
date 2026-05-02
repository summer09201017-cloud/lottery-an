import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sliders, Maximize, X } from 'lucide-react';
import { clsx } from 'clsx';

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 w-full text-left"
    >
      <div className="flex flex-col">
        <span className="text-xs text-white">{label}</span>
        {hint && <span className="text-[10px] text-gray-500 mt-0.5">{hint}</span>}
      </div>
      <div
        className={clsx(
          'w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ml-2',
          checked ? 'bg-indigo-500' : 'bg-gray-600'
        )}
      >
        <div
          className={clsx(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  );
}

export function AdvancedSettings() {
  const { settings, updateSettings } = useAppStore();
  const [open, setOpen] = useState(false);

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1 self-start"
      >
        <Sliders className="w-3 h-3" /> {open ? '收起進階' : '進階設定'}
      </button>

      {open && (
        <div className="flex flex-col gap-2 p-2 rounded-lg bg-gray-900/60 border border-gray-800">
          <Toggle
            label="抽獎前 3-2-1 倒數"
            checked={settings.countdownEnabled}
            onChange={() => updateSettings({ countdownEnabled: !settings.countdownEnabled })}
          />
          <Toggle
            label="抽獎前確認"
            hint="防止誤觸"
            checked={settings.confirmBeforeDraw}
            onChange={() => updateSettings({ confirmBeforeDraw: !settings.confirmBeforeDraw })}
          />
          <Toggle
            label="顯示公正碼"
            hint="SHA-256 公平驗證"
            checked={settings.fairnessMode}
            onChange={() => updateSettings({ fairnessMode: !settings.fairnessMode })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 mt-1">中獎金句模板</label>
            <input
              type="text"
              value={settings.congratsTemplate}
              onChange={(e) => updateSettings({ congratsTemplate: e.target.value })}
              className="px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white text-xs"
            />
            <span className="text-[10px] text-gray-500">
              支援 <code className="bg-gray-800 px-1 rounded">{'{name}'}</code>{' '}
              <code className="bg-gray-800 px-1 rounded">{'{prize}'}</code>
            </span>
          </div>

          <button
            onClick={enterFullscreen}
            className="mt-1 flex items-center justify-center gap-2 py-2 bg-purple-700/40 hover:bg-purple-700/60 border border-purple-600 text-white rounded-lg text-xs"
          >
            <Maximize className="w-3 h-3" /> 進入 / 離開全螢幕
          </button>
        </div>
      )}
    </div>
  );
}

export { X as XIcon };
