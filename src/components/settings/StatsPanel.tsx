import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BarChart3, Download, FileImage, X } from 'lucide-react';
import { toPng } from 'html-to-image';

export function StatsPanel() {
  const { history, items } = useAppStore();
  const [open, setOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((h) => counts.set(h.name, (counts.get(h.name) ?? 0) + 1));
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] ?? 1;
    return { entries, max, total: history.length };
  }, [history]);

  const exportCsv = () => {
    if (history.length === 0) return;
    const rows = ['日期時間,獎項,中獎者,公正碼'];
    history.forEach((h) => {
      rows.push(
        [
          new Date(h.date).toLocaleString(),
          h.prizeTier ?? '',
          h.name,
          h.fairnessCode ?? '',
        ].join(',')
      );
    });
    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `中獎紀錄_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: '#0f172a', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `中獎名單_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert('匯出 PNG 失敗');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs"
      >
        <BarChart3 className="w-4 h-4 text-indigo-400" /> 統計與匯出
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" /> 抽獎統計
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={exportRef} className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Stat label="總抽獎次數" value={stats.total} />
                <Stat label="中獎人數" value={stats.entries.length} />
                <Stat label="名單剩餘" value={items.length} />
              </div>

              {history.length === 0 ? (
                <div className="text-center text-gray-500 py-8">尚無抽獎紀錄</div>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-gray-300 mb-2">中獎次數排行</h3>
                  <div className="flex flex-col gap-1.5 mb-6">
                    {stats.entries.slice(0, 15).map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-24 text-xs text-gray-300 truncate">{name}</span>
                        <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-end pr-2"
                            style={{ width: `${(count / stats.max) * 100}%` }}
                          >
                            <span className="text-[10px] text-white font-bold">{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-bold text-gray-300 mb-2">完整中獎紀錄</h3>
                  <table className="w-full text-xs">
                    <thead className="text-gray-500">
                      <tr>
                        <th className="text-left py-1">時間</th>
                        <th className="text-left py-1">獎項</th>
                        <th className="text-left py-1">中獎者</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 50).map((h, i) => (
                        <tr key={i} className="border-t border-gray-800">
                          <td className="py-1 text-gray-400">
                            {new Date(h.date).toLocaleString().slice(5)}
                          </td>
                          <td className="py-1 text-amber-300">{h.prizeTier ?? '—'}</td>
                          <td className="py-1 text-emerald-300 font-bold">{h.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-800 bg-gray-900 sticky bottom-0">
              <button
                onClick={exportCsv}
                disabled={history.length === 0}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={exportPng}
                disabled={history.length === 0}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
              >
                <FileImage className="w-4 h-4" /> PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-gray-700">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[10px] text-gray-400 mt-1">{label}</div>
    </div>
  );
}
