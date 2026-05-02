import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export function CountdownOverlay({ onComplete, onCancel }: Props) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setCount(count - 1), 800);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center"
      onClick={onCancel}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-[20vw] sm:text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-500 to-pink-600 drop-shadow-[0_0_50px_rgba(251,191,36,0.6)] leading-none select-none"
        >
          {count > 0 ? count : 'GO!'}
        </motion.div>
      </AnimatePresence>
      <p className="absolute bottom-10 text-gray-400 text-sm">點擊任意處取消</p>
    </div>
  );
}
