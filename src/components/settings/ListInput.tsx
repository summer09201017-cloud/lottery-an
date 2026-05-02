import { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Share2,
  Upload,
  Download,
  Plus,
  X,
  FileText,
  Pencil,
  QrCode,
  Image as ImageIcon,
  Images,
} from 'lucide-react';
import { clsx } from 'clsx';
import QRCode from 'qrcode';
import { compressImage } from '../../hooks/useImageHelper';

interface ParsedLine {
  name: string;
  weight: number;
  group?: string;
}

function parseLine(line: string): ParsedLine | null {
  const parts = line.split(/[,\t]/).map((p) => p.trim());
  const name = parts[0];
  if (!name) return null;
  let weight = 1;
  let group: string | undefined;
  if (parts.length > 1) {
    const w = parseFloat(parts[1]);
    if (!isNaN(w) && w > 0) weight = w;
  }
  if (parts.length > 2 && parts[2]) group = parts[2];
  return { name, weight, group };
}

function buildShareUrl(items: { name: string; weight: number; group?: string }[]) {
  const data = items.map((i) => {
    const main = i.weight === 1 ? i.name : `${i.name},${i.weight}`;
    return i.group ? `${main},${i.group}` : main;
  });
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  const url = new URL(window.location.href);
  url.searchParams.set('list', encoded);
  return url.toString();
}

export function ListInput() {
  const { items, setItems } = useAppStore();
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingWeight, setEditingWeight] = useState('1');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pickingImageFor, setPickingImageFor] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);

  const openBulk = () => {
    setBulkText(
      items
        .map((i) => {
          const base = i.weight !== 1 ? `${i.name},${i.weight}` : i.name;
          return i.group ? `${base},${i.group}` : base;
        })
        .join('\n')
    );
    setBulkMode(true);
  };

  const applyBulk = () => {
    const lines = bulkText.split('\n');
    const next = lines
      .map(parseLine)
      .filter((l): l is ParsedLine => l !== null)
      .map((l) => ({
        id: crypto.randomUUID(),
        ...l,
      }));
    setItems(next);
    setBulkMode(false);
  };

  const handleAddItem = () => {
    const parsed = parseLine(newItemName);
    if (!parsed) return;
    setItems([...items, { id: crypto.randomUUID(), ...parsed }]);
    setNewItemName('');
  };

  const handleRemove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const startEdit = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setEditingId(id);
    setEditingValue(it.name);
    setEditingWeight(String(it.weight));
  };

  const commitEdit = () => {
    if (!editingId) return;
    const w = parseFloat(editingWeight);
    setItems(
      items.map((i) =>
        i.id === editingId
          ? { ...i, name: editingValue.trim() || i.name, weight: !isNaN(w) && w > 0 ? w : 1 }
          : i
      )
    );
    setEditingId(null);
  };

  const handleCsvImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      // Strip BOM
      const clean = text.replace(/^﻿/, '');
      const lines = clean.split(/\r?\n/);
      const next = lines
        .map(parseLine)
        .filter((l): l is ParsedLine => l !== null)
        .map((l) => ({ id: crypto.randomUUID(), ...l }));
      if (next.length > 0) setItems(next);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCsvExport = () => {
    if (items.length === 0) return;
    const rows = ['名稱,權重,群組'];
    items.forEach((i) => {
      rows.push(`${i.name},${i.weight},${i.group ?? ''}`);
    });
    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `抽獎名單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageForItem = async (itemId: string, file: File) => {
    try {
      const dataUrl = await compressImage(file, 256, 0.85);
      setItems(items.map((i) => (i.id === itemId ? { ...i, imageUrl: dataUrl } : i)));
    } catch (e) {
      console.error(e);
      alert('圖片處理失敗');
    }
  };

  const removeImage = (itemId: string) => {
    setItems(
      items.map((i) => {
        if (i.id !== itemId) return i;
        const { imageUrl, ...rest } = i;
        void imageUrl;
        return rest;
      })
    );
  };

  const handleBulkImageImport = async (files: FileList) => {
    setBulkImporting(true);
    try {
      const arr = Array.from(files);
      const newItems = await Promise.all(
        arr.map(async (f) => {
          const dataUrl = await compressImage(f, 256, 0.85);
          const baseName = f.name.replace(/\.[^.]+$/, '');
          return {
            id: crypto.randomUUID(),
            name: baseName || '未命名',
            weight: 1,
            imageUrl: dataUrl,
          };
        })
      );
      setItems([...items, ...newItems]);
    } catch (e) {
      console.error(e);
      alert('部分圖片處理失敗');
    } finally {
      setBulkImporting(false);
    }
  };

  const handleShare = async () => {
    if (items.length === 0) return;
    try {
      const url = buildShareUrl(items);
      await navigator.clipboard.writeText(url);
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 1 });
      setQrUrl(url);
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error(e);
      alert('產生連結失敗');
    }
  };

  if (bulkMode) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-sm font-semibold text-gray-300">
          批次編輯 (每行 名字,權重,群組)
        </label>
        <textarea
          className="w-full h-48 p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-mono text-sm"
          placeholder={'小明\n小華,5\n小美,1,業務部'}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={applyBulk}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm"
          >
            套用
          </button>
          <button
            onClick={() => setBulkMode(false)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-300">名單 ({items.length})</label>
        <div className="flex gap-1">
          <button
            onClick={openBulk}
            className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1"
            title="批次編輯"
          >
            <FileText className="w-3 h-3" /> 批次
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1"
            title="匯入 CSV"
          >
            <Upload className="w-3 h-3" /> 匯入
          </button>
          <button
            onClick={() => bulkImageInputRef.current?.click()}
            disabled={bulkImporting}
            className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1 disabled:opacity-30"
            title="批次匯入照片（檔名為名稱）"
          >
            <Images className="w-3 h-3" /> {bulkImporting ? '處理中…' : '照片'}
          </button>
          <button
            onClick={handleCsvExport}
            disabled={items.length === 0}
            className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1 disabled:opacity-30"
            title="匯出 CSV"
          >
            <Download className="w-3 h-3" /> 匯出
          </button>
          <button
            onClick={handleShare}
            disabled={items.length === 0}
            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1 disabled:opacity-30"
            title="QR 分享"
          >
            <Share2 className="w-3 h-3" /> 分享
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleCsvImport(f);
          e.target.value = '';
        }}
      />
      <input
        ref={bulkImageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const fs = e.target.files;
          if (fs && fs.length > 0) handleBulkImageImport(fs);
          e.target.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && pickingImageFor) handleImageForItem(pickingImageFor, f);
          setPickingImageFor(null);
          e.target.value = '';
        }}
      />

      {/* Quick add */}
      <div className="flex gap-1">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="輸入名字後 Enter 新增"
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemName.trim()}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 min-h-[60px]">
        {items.length === 0 ? (
          <div className="text-xs text-gray-500 m-auto">尚無項目，輸入名字或匯入 CSV</div>
        ) : (
          items.map((item) =>
            editingId === item.id ? (
              <div
                key={item.id}
                className="flex items-center gap-1 bg-indigo-700 rounded-full pl-2 pr-1 py-1"
              >
                <input
                  autoFocus
                  className="bg-transparent w-20 text-xs outline-none text-white"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                />
                <input
                  className="bg-black/30 w-10 text-xs outline-none text-white px-1 rounded"
                  value={editingWeight}
                  onChange={(e) => setEditingWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                />
                <button onClick={commitEdit} className="text-xs text-white px-1">
                  ✓
                </button>
              </div>
            ) : (
              <div
                key={item.id}
                className={clsx(
                  'group flex items-center gap-1 rounded-full py-1 text-xs border',
                  item.imageUrl ? 'pl-1' : 'pl-2.5',
                  'pr-1',
                  item.weight > 1
                    ? 'bg-amber-900/40 border-amber-600 text-amber-100'
                    : 'bg-gray-700 border-gray-600 text-gray-100'
                )}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-600"
                  />
                )}
                <span className="font-medium max-w-[90px] truncate">{item.name}</span>
                {item.weight !== 1 && (
                  <span className="text-[10px] text-amber-300 font-bold">×{item.weight}</span>
                )}
                <button
                  onClick={() => {
                    if (item.imageUrl) {
                      removeImage(item.id);
                    } else {
                      setPickingImageFor(item.id);
                      setTimeout(() => imageInputRef.current?.click(), 0);
                    }
                  }}
                  className={clsx(
                    'p-0.5',
                    item.imageUrl
                      ? 'text-pink-300 hover:text-red-300'
                      : 'opacity-50 hover:opacity-100'
                  )}
                  title={item.imageUrl ? '移除圖片' : '加入圖片'}
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={() => startEdit(item.id)}
                  className="opacity-50 hover:opacity-100 p-0.5"
                  title="編輯"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="opacity-50 hover:opacity-100 hover:text-red-300 p-0.5"
                  title="移除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          )
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-xs text-gray-500">
        <span>📌 名字後加 ,數字 設權重；再加 ,文字 設群組</span>
        <span>📷 點 chip 上的相片圖示加入照片；或按上方「照片」批次匯入（檔名為名稱）</span>
      </div>

      {qrDataUrl && qrUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setQrDataUrl(null);
            setQrUrl(null);
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5" /> 分享名單
              </h3>
              <button
                onClick={() => {
                  setQrDataUrl(null);
                  setQrUrl(null);
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={qrDataUrl} alt="QR Code" className="w-full mx-auto" />
            <p className="text-xs text-gray-600 mt-3 text-center">
              掃描或點擊下方連結即可載入此名單
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(qrUrl)}
              className="mt-3 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-800 font-mono break-all"
            >
              {qrUrl}
            </button>
            <p className="text-[10px] text-emerald-600 text-center mt-2">✓ 連結已複製到剪貼簿</p>
          </div>
        </div>
      )}
    </div>
  );
}
