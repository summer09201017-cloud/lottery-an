import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { RandomEngine } from '../../engine/RandomEngine';
import type { LotteryItem } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MarqueeMode() {
  const { items, addHistory } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [winner, setWinner] = useState<LotteryItem | null>(null);
  
  const drawTimeoutRef = useRef<number | null>(null);

  const startDraw = () => {
    if (items.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setWinner(null);
    
    // Choose winner mathematically first
    const winningItem = RandomEngine.drawWeighted(items);
    if (!winningItem) return;
    
    const winningIndex = items.findIndex(i => i.id === winningItem.id);

    // Animation settings
    let jumps = 0;
    // For ~12 seconds of animation, we need a lot of jumps
    const minJumps = Math.max(150, items.length * 5); 
    const maxJumps = minJumps + Math.max(50, items.length);
    let targetJumps = minJumps + Math.floor(Math.random() * (maxJumps - minJumps));
    
    // Ensure the last jump lands on the winning index
    const currentVirtualIndex = (targetJumps) % items.length;
    const offset = (winningIndex - currentVirtualIndex + items.length) % items.length;
    targetJumps += offset;

    let currentSpeed = 50; // Initial fast speed (ms)
    
    const jump = () => {
      jumps++;
      
      setActiveIndex((prev) => (prev + 1) % items.length);
      playTick();

      // Vibrate on mobile
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      if (jumps < targetJumps) {
        // Calculate next speed (easing out)
        const progress = jumps / targetJumps;
        if (progress > 0.7) {
          currentSpeed += 15 * Math.pow((progress - 0.7) * 3.33, 2);
        }
        
        drawTimeoutRef.current = window.setTimeout(jump, currentSpeed);
      } else {
        // Finish
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
          navigator.vibrate([100, 50, 100, 50, 200]); // Win vibration pattern
        }
      }
    };

    jump();
  };

  useEffect(() => {
    return () => {
      if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 p-4">
      {/* Grid Container */}
      <div className="w-full max-w-4xl max-h-[60vh] overflow-y-auto p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            請先在左側輸入抽獎名單
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence>
              {items.map((item, index) => {
                const isActive = activeIndex === index;
                const isWinner = winner?.id === item.id;
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "relative flex items-center justify-center h-20 sm:h-24 p-2 rounded-lg text-center transition-all duration-100",
                      isActive ? "bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.8)] scale-105 z-10" : "bg-gray-800",
                      isWinner ? "bg-green-500 shadow-[0_0_30px_rgba(34,197,94,1)] scale-110 z-20" : "",
                      !isActive && !isWinner && "opacity-80"
                    )}
                  >
                    <span className={cn(
                      "font-bold truncate w-full px-2",
                      isActive || isWinner ? "text-white text-lg" : "text-gray-300"
                    )}>
                      {item.name}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Control Area */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={startDraw}
          disabled={isDrawing || items.length === 0}
          className={cn(
            "group relative flex items-center justify-center gap-2 px-8 py-4 text-2xl font-black tracking-wider text-white uppercase transition-all duration-200 rounded-full",
            isDrawing || items.length === 0
              ? "bg-gray-700 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] active:scale-95"
          )}
        >
          <Play className="w-8 h-8" fill="currentColor" />
          {isDrawing ? '抽獎中...' : '開始抽獎'}
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
