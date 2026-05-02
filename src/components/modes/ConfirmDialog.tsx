import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface Props {
  count: number;
  tierName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ count, tierName, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <h3 className="text-lg font-bold text-white">確認開始抽獎？</h3>
        </div>
        <p className="text-sm text-gray-300 mb-5">
          將抽出{' '}
          <span className="text-amber-300 font-bold">{count}</span> 位
          {tierName && (
            <>
              {' '}
              <span className="text-amber-300 font-bold">「{tierName}」</span>
            </>
          )}
          中獎者，按下後動畫無法停止。
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg font-bold shadow-lg"
          >
            開始
          </button>
        </div>
      </motion.div>
    </div>
  );
}
