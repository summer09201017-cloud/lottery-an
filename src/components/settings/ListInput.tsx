import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Share2 } from 'lucide-react';

export function ListInput() {
  const { items, setItems } = useAppStore();
  const [inputText, setInputText] = useState('');

  // Sync from store -> textarea ONLY if items changed externally (e.g. autoExclude or URL load)
  useEffect(() => {
    const currentParsedNames = inputText
      .split('\n')
      .map(l => l.split(',')[0].trim())
      .filter(l => l.length > 0);
      
    const storeNames = items.map(i => i.name);
    
    // Check if the store differs from what we currently have in textarea
    const isDifferent = currentParsedNames.length !== storeNames.length || 
      currentParsedNames.some((name, i) => name !== storeNames[i]);
      
    if (isDifferent) {
      setInputText(items.map(i => i.weight !== 1 ? `${i.name},${i.weight}` : i.name).join('\n'));
    }
  }, [items]); // Removed inputText from deps to avoid loop, it's safe here.

  const handleTextChange = (text: string) => {
    setInputText(text);
    
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newItems = lines.map((line) => {
      // Parse "Name,Weight"
      const parts = line.split(',');
      const name = parts[0].trim();
      let weight = 1;
      
      if (parts.length > 1) {
        const parsedWeight = parseFloat(parts[1]);
        if (!isNaN(parsedWeight) && parsedWeight > 0) {
          weight = parsedWeight;
        }
      }
      
      return {
        id: crypto.randomUUID(),
        name,
        weight,
      };
    });

    setItems(newItems);
  };

  const handleShare = () => {
    if (items.length === 0) return;
    
    try {
      const listData = items.map(i => i.weight === 1 ? i.name : `${i.name},${i.weight}`);
      const encoded = btoa(encodeURIComponent(JSON.stringify(listData)));
      const url = new URL(window.location.href);
      url.searchParams.set('list', encoded);
      
      navigator.clipboard.writeText(url.toString());
      alert('分享連結已複製到剪貼簿！朋友們點開網址即可載入此名單。');
    } catch (e) {
      console.error(e);
      alert('產生連結失敗');
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-300">
          名單輸入 (每行一個，可加逗號設權重)
        </label>
        <button 
          onClick={handleShare}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          title="產生分享連結"
        >
          <Share2 className="w-3 h-3" /> 分享
        </button>
      </div>
      <textarea
        className="w-full h-48 p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
        placeholder="例如：\n小明\n小華,5 (權重為5倍)"
        value={inputText}
        onChange={(e) => handleTextChange(e.target.value)}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>支援直接貼上 Excel 格式</span>
        <span>共 {items.length} 人</span>
      </div>
    </div>
  );
}
