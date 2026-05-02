import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import type { LotteryItem } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useDrawSession } from '../../hooks/useDrawSession';
import { CountdownOverlay } from './CountdownOverlay';
import { ConfirmDialog } from './ConfirmDialog';
import { Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MarqueeMode() {
  const { items, settings } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  const session = useDrawSession();

  const [isDrawing, setIsDrawing] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [winners, setWinners] = useState<LotteryItem[]>([]);
  const [revealedIdx, setRevealedIdx] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [fairnessCode, setFairnessCode] = useState<string | null>(null);
  const drawTimeoutRef = useRef<number | null>(null);

  const animateOneDraw = (winningItem: LotteryItem, onDone: () => void) => {
    const winningIndex = items.findIndex((i) => i.id === winningItem.id);
    let jumps = 0;
    const minJumps = Math.max(80, items.length * 4);
    const maxJumps = minJumps + Math.max(30, items.length);
    let targetJumps = minJumps + Math.floor(Math.random() * (maxJumps - minJumps));
    const currentVirtualIndex = targetJumps % items.length;
    const offset = (winningIndex - currentVirtualIndex + items.length) % items.length;
    targetJumps += offset;
    let currentSpeed = 50;

    const jump = () => {
      jumps++;
      setActiveIndex((prev) => (prev + 1) % items.length);
      playTick();
      if (navigator.vibrate) navigator.vibrate(8);
      if (jumps < targetJumps) {
        const progress = jumps / targetJumps;
        if (progress > 0.7) currentSpeed += 12 * Math.pow((progress - 0.7) * 3.33, 2);
        drawTimeoutRef.current = window.setTimeout(jump, currentSpeed);
      } else {
        onDone();
      }
    };
    jump();
  };

  const startDrawSequence = async () => {
    setWinners([]);
    setFairnessCode(null);
    setRevealedIdx(0);
    const drawn = session.drawWinners();
    if (drawn.length === 0) return;

    setIsDrawing(true);
    const collected: LotteryItem[] = [];

    for (let i = 0; i < drawn.length; i++) {
      await new Promise<void>((resolve) => {
        animateOneDraw(drawn[i], () => {
          collected.push(drawn[i]);
          setWinners([...collected]);
          setRevealedIdx(collected.length);
          playWin();
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d'],
          });
          if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
          setTimeout(resolve, drawn.length > 1 ? 500 : 200);
        });
      });
    }

    const code = await session.recordWinners(collected);
    if (code) setFairnessCode(code);
    setIsDrawing(false);
    setActiveIndex(-1);
  };

  const handleStart = () => {
    if (items.length === 0 || isDrawing) return;
    session.requestStart(() => {
      if (settings.countdownEnabled) {
        setShowCountdown(true);
      } else {
        startDrawSequence();
      }
    });
  };

  useEffect(() => {
    return () => {
      if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
    };
  }, []);

  const drawCount = session.drawCount;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 p-4">
      <div className="w-full max-w-4xl max-h-[55vh] overflow-y-auto p-4 rounded-xl bg-gray-900/80 backdrop-blur-sm border border-gray-800 shadow-2xl">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            請先在左側輸入抽獎名單
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence>
              {items.map((item, index) => {
                const isActive = activeIndex === index;
                const isWinner = winners.some((w) => w.id === item.id);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      'relative flex flex-col items-center justify-center h-24 sm:h-28 p-2 rounded-lg text-center transition-all duration-100 overflow-hidden',
                      isActive
                        ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.8)] scale-105 z-10'
                        : 'bg-gray-800',
                      isWinner
                        ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,1)] scale-110 z-20'
                        : '',
                      !isActive && !isWinner && 'opacity-80'
                    )}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={cn(
                          'rounded-md object-cover mb-1 border',
                          isActive || isWinner
                            ? 'w-12 h-12 border-white/60'
                            : 'w-10 h-10 border-gray-700'
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'font-bold truncate w-full px-1',
                        isActive || isWinner ? 'text-white text-base' : 'text-gray-300 text-sm'
                      )}
                    >
                      {item.name}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleStart}
          disabled={isDrawing || items.length === 0}
          className={cn(
            'group relative flex items-center justify-center gap-2 px-8 py-4 text-2xl font-black tracking-wider text-white uppercase transition-all duration-200 rounded-full',
            isDrawing || items.length === 0
              ? 'bg-gray-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] active:scale-95'
          )}
        >
          <Play className="w-8 h-8" fill="currentColor" />
          {isDrawing
            ? '抽獎中...'
            : drawCount > 1
            ? `開始抽獎 (${drawCount} 位)`
            : '開始抽獎'}
        </button>

        {session.currentTier && !isDrawing && (
          <div className="text-sm text-amber-200">
            🏆 本輪：<span className="font-bold">{session.currentTier.name}</span> ×
            {session.currentTier.count}
          </div>
        )}

        {winners.length > 0 && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              {winners.length === 1
                ? session.formatCongrats(winners[0])
                : `🎉 共 ${winners.length} 位中獎`}
            </div>
            {winners.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-2xl">
                {winners.slice(0, revealedIdx).map((w, i) => (
                  <motion.span
                    key={w.id + i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 pl-1 pr-3 py-1 bg-emerald-700/60 border border-emerald-500 rounded-full text-white font-medium"
                  >
                    {w.imageUrl && (
                      <img
                        src={w.imageUrl}
                        alt={w.name}
                        className="w-6 h-6 rounded-full object-cover border border-white/40"
                      />
                    )}
                    {w.name}
                  </motion.span>
                ))}
              </div>
            )}
            {fairnessCode && (
              <div className="text-[10px] text-gray-500 mt-2 font-mono">
                公正碼: {fairnessCode}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {showCountdown && (
        <CountdownOverlay
          onComplete={() => {
            setShowCountdown(false);
            startDrawSequence();
          }}
          onCancel={() => setShowCountdown(false)}
        />
      )}

      {session.pendingConfirm && (
        <ConfirmDialog
          count={drawCount}
          tierName={session.currentTier?.name}
          onConfirm={session.confirmStart}
          onCancel={session.cancelStart}
        />
      )}
    </div>
  );
}
