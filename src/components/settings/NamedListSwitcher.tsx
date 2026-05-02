import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FolderOpen, Save, Trash2 } from 'lucide-react';

export function NamedListSwitcher() {
  const {
    savedLists,
    saveCurrentAsList,
    loadList,
    deleteList,
    currentListName,
    items,
  } = useAppStore();
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');

  const doSave = () => {
    const finalName = name.trim() || `名單_${new Date().toLocaleDateString()}`;
    saveCurrentAsList(finalName);
    setShowSave(false);
    setName('');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <FolderOpen className="w-4 h-4" /> 名單管理
        <span className="ml-auto text-[10px] text-gray-500 font-normal truncate max-w-[140px]">
          目前：{currentListName}
        </span>
      </label>

      <div className="flex gap-1">
        <button
          onClick={() => setShowSave(!showSave)}
          disabled={items.length === 0}
          className="flex-1 px-2 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded flex items-center justify-center gap-1"
        >
          <Save className="w-3 h-3" /> 儲存目前
        </button>
      </div>

      {showSave && (
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="名單名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSave()}
            className="flex-1 px-2 py-1.5 rounded bg-gray-900 border border-gray-700 text-white text-xs"
            autoFocus
          />
          <button
            onClick={doSave}
            className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded"
          >
            確定
          </button>
        </div>
      )}

      {savedLists.length > 0 && (
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {savedLists.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-700 group"
            >
              <button
                onClick={() => loadList(l.id)}
                className="flex-1 text-left text-xs text-white truncate"
              >
                {l.name}{' '}
                <span className="text-gray-500 text-[10px]">
                  ({l.items.length}人)
                </span>
              </button>
              <button
                onClick={() => deleteList(l.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
