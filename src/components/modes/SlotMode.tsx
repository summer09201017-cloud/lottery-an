import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { RandomEngine } from '../../engine/RandomEngine';
import type { LotteryItem } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Play } from 'lucide-react';
import { clsx } from 'clsx';

export function SlotMode() {
  const { items, addHistory } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<LotteryItem | null>(null);
  
  const controls1 = useAnimation();
  const controls2 = useAnimation();
  const controls3 = useAnimation();
  const controls = [controls1, controls2, controls3];

  // Create a VERY long list for 12 seconds of spinning
  // 150 copies
  const slotItems = Array.from({ length: 150 }).flatMap(() => items);
  const itemHeight = 80;

  const startDraw = async () => {
    if (items.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setWinner(null);
    
    const winningItem = RandomEngine.drawWeighted(items);
    if (!winningItem) return;
    
    const winningIndexInBlock = items.findIndex(i => i.id === winningItem.id);
    
    // We want the 3 columns to stop sequentially but land on the same winner
    // Col 1 stops at ~6s, Col 2 at ~9s, Col 3 at ~12s
    // To maintain spinning speed, they need to travel different distances.
    const targetIndices = [
      (40 * items.length) + winningIndexInBlock, // Col 1
      (80 * items.length) + winningIndexInBlock, // Col 2
      (140 * items.length) + winningIndexInBlock // Col 3
    ];
    
    const targetYs = targetIndices.map(idx => -(idx * itemHeight) + itemHeight);
    const durations = [6, 9, 12];

    // Simulate ticks
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount > 40) {
        if (Math.random() > 0.5) playTick();
      } else {
        playTick();
      }
    }, 150);

    // Initial small pull-back (anticipation) for all columns
    controls.forEach(c => c.start({
      y: 20,
      transition: { duration: 0.3, ease: "easeOut" }
    }));

    // Start all spins simultaneously but with different durations
    await Promise.all(
      controls.map((c, i) => 
        c.start({
          y: targetYs[i],
          transition: { 
            duration: durations[i], 
            ease: [0.1, 0.95, 0.25, 1] // Custom ease out
          }
        })
      )
    );

    clearInterval(tickInterval);
    setIsDrawing(false);
    setWinner(winningItem);
    playWin();
    addHistory(winningItem);
    
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    });
    
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200, 100, 400]);
    }
  };

  useEffect(() => {
    controls.forEach(c => c.set({ y: itemHeight })); 
    setWinner(null);
  }, [items]); // removed controls from deps

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 p-4">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl">
          請先在左側輸入抽獎名單
        </div>
      ) : (
        <div className="relative w-full max-w-3xl h-[240px] bg-gray-900 border-[8px] border-gray-800 rounded-2xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          {/* Glass overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/80 via-transparent to-black/80" />
          
          {/* Center target line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/60 z-20 -translate-y-1/2 shadow-[0_0_15px_rgba(239,68,68,1)] pointer-events-none" />
          
          {/* 3 Columns Layout */}
          <div className="flex w-full h-full divide-x divide-gray-800/50">
            {controls.map((control, colIndex) => (
              <div key={colIndex} className="flex-1 relative overflow-hidden">
                <motion.div 
                  className="flex flex-col items-center w-full absolute left-0 right-0"
                  animate={control}
                  initial={{ y: itemHeight }}
                >
                  {slotItems.map((item, i) => (
                    <div 
                      key={`${item.id}-${colIndex}-${i}`}
                      className="flex items-center justify-center w-full font-bold text-xl sm:text-2xl lg:text-3xl border-b border-gray-800/30 text-gray-200 px-2 truncate"
                      style={{ height: `${itemHeight}px` }}
                    >
                      {item.name}
                    </div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Area */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <button
          onClick={startDraw}
          disabled={isDrawing || items.length === 0}
          className={clsx(
            "group relative flex items-center justify-center gap-2 px-8 py-4 text-2xl font-black tracking-wider text-white uppercase transition-all duration-200 rounded-full",
            isDrawing || items.length === 0
              ? "bg-gray-700 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-400 hover:to-red-500 hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.5)] active:scale-95"
          )}
        >
          <Play className="w-8 h-8" fill="currentColor" />
          {isDrawing ? '拉動中...' : '開始拉霸 (三連星)'}
        </button>

        {winner && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600"
          >
            🎰 恭喜中獎：{winner.name} 🎰
          </motion.div>
        )}
      </div>
    </div>
  );
}
