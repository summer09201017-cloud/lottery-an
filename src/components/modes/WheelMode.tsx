import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { RandomEngine } from '../../engine/RandomEngine';
import type { LotteryItem } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Play } from 'lucide-react';
import { clsx } from 'clsx';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

export function WheelMode() {
  const { items, addHistory } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<LotteryItem | null>(null);

  // Calculate slice angles based on weights
  const slices = useMemo(() => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = 0;
    
    return items.map((item, index) => {
      const angle = (item.weight / totalWeight) * 360;
      const slice = {
        item,
        startAngle,
        endAngle: startAngle + angle,
        color: COLORS[index % COLORS.length]
      };
      startAngle += angle;
      return slice;
    });
  }, [items]);

  const startDraw = () => {
    if (items.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setWinner(null);
    
    // 1. Choose winner
    const winningItem = RandomEngine.drawWeighted(items);
    if (!winningItem) return;
    
    const winningSlice = slices.find(s => s.item.id === winningItem.id);
    if (!winningSlice) return;

    // 2. Calculate target rotation
    // CSS rotation 0 is Top. Slices are drawn starting from Top (0deg) going clockwise.
    // The pointer is at the Top.
    // To land in the middle of the winning slice:
    const sliceCenterAngle = winningSlice.startAngle + (winningSlice.endAngle - winningSlice.startAngle) / 2;
    
    // We want: (rotation + sliceCenterAngle) % 360 === 360 (or 0)
    // So the rotation needed to bring it to top is: 360 - sliceCenterAngle
    
    // Add random jitter within the slice so it doesn't always land exactly in the center
    const jitterHalf = (winningSlice.endAngle - winningSlice.startAngle) * 0.4; // 80% of slice width
    const jitter = (Math.random() * 2 - 1) * jitterHalf;
    
    const targetBase = 360 - (sliceCenterAngle + jitter);
    
    // Add spins (e.g., 20 to 30 full spins for 12 seconds)
    const spins = 20 + Math.floor(Math.random() * 10);
    const finalRotation = rotation + (spins * 360) + ((targetBase - rotation) % 360 + 360) % 360;

    // Simulate ticks using intervals since framer-motion `onUpdate` is tricky for playing sound reliably
    // We'll just play a sound a few times based on time
    let tickCount = 0;
    const duration = 12000; // 12 seconds
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount > 45) {
        // slow down ticks in the last few seconds
        if (Math.random() > 0.5) playTick();
      } else {
        playTick();
      }
    }, 200);

    setRotation(finalRotation);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsDrawing(false);
      setWinner(winningItem);
      playWin();
      addHistory(winningItem);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }, duration);
  };

  // Helper to draw SVG slices
  const createSlicePath = (startAngle: number, endAngle: number) => {
    // If it's a full circle (1 item)
    if (endAngle - startAngle === 360) {
      return "M 100,0 A 100,100 0 1,1 99.9,0 Z";
    }

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 100 + 100 * Math.cos(startRad);
    const y1 = 100 + 100 * Math.sin(startRad);
    const x2 = 100 + 100 * Math.cos(endRad);
    const y2 = 100 + 100 * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M 100,100 L ${x1},${y1} A 100,100 0 ${largeArcFlag},1 ${x2},${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 p-4">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl">
          請先在左側輸入抽獎名單
        </div>
      ) : (
        <div className="relative w-80 h-80 sm:w-96 sm:h-96">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 drop-shadow-lg">
            <div className="w-8 h-12 bg-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
          </div>

          {/* Wheel */}
          <motion.div
            className="w-full h-full rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-gray-800 relative overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ duration: 12, ease: [0.1, 0.95, 0.25, 1] }} // smooth ease out over 12s
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {slices.map((slice, i) => (
                <path
                  key={i}
                  d={createSlicePath(slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  stroke="#1f2937"
                  strokeWidth="1"
                />
              ))}
              {/* Text labels */}
              {slices.map((slice, i) => {
                const angle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
                // Calculate rotation for text so it points outward
                return (
                  <g key={`text-${i}`} transform={`translate(100, 100) rotate(${angle - 90})`}>
                    <text
                      x="45"
                      y="5"
                      fill="white"
                      fontSize={items.length > 20 ? "6" : "10"}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="drop-shadow-md"
                    >
                      {slice.item.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>
      )}

      {/* Control Area */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={startDraw}
          disabled={isDrawing || items.length === 0}
          className={clsx(
            "group relative flex items-center justify-center gap-2 px-8 py-4 text-2xl font-black tracking-wider text-white uppercase transition-all duration-200 rounded-full",
            isDrawing || items.length === 0
              ? "bg-gray-700 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.5)] active:scale-95"
          )}
        >
          <Play className="w-8 h-8" fill="currentColor" />
          {isDrawing ? '轉動中...' : '開始轉盤'}
        </button>

        {winner && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600"
          >
            🎉 恭喜中獎：{winner.name} 🎉
          </motion.div>
        )}
      </div>
    </div>
  );
}
