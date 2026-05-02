import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import type { LotteryItem } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useDrawSession } from '../../hooks/useDrawSession';
import { CountdownOverlay } from './CountdownOverlay';
import { ConfirmDialog } from './ConfirmDialog';
import { Play } from 'lucide-react';
import { clsx } from 'clsx';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
];

function truncateForWheel(name: string, count: number) {
  const max = count > 30 ? 3 : count > 20 ? 5 : count > 12 ? 7 : 10;
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + '…';
}

export function WheelMode() {
  const { items, settings } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  const session = useDrawSession();

  const [isDrawing, setIsDrawing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winners, setWinners] = useState<LotteryItem[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [fairnessCode, setFairnessCode] = useState<string | null>(null);

  const slices = useMemo(() => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = 0;
    return items.map((item, index) => {
      const angle = (item.weight / totalWeight) * 360;
      const slice = {
        item,
        startAngle,
        endAngle: startAngle + angle,
        color: COLORS[index % COLORS.length],
      };
      startAngle += angle;
      return slice;
    });
  }, [items]);

  const spinOnce = (winner: LotteryItem, baseRotation: number, duration = 6) => {
    return new Promise<number>((resolve) => {
      const winningSlice = slices.find((s) => s.item.id === winner.id);
      if (!winningSlice) {
        resolve(baseRotation);
        return;
      }
      const sliceCenterAngle =
        winningSlice.startAngle + (winningSlice.endAngle - winningSlice.startAngle) / 2;
      const jitterHalf = (winningSlice.endAngle - winningSlice.startAngle) * 0.4;
      const jitter = (Math.random() * 2 - 1) * jitterHalf;
      const targetBase = 360 - (sliceCenterAngle + jitter);
      const spins = 12 + Math.floor(Math.random() * 6);
      const finalRotation =
        baseRotation + spins * 360 + (((targetBase - baseRotation) % 360) + 360) % 360;

      let tickCount = 0;
      const tickInterval = setInterval(() => {
        tickCount++;
        if (tickCount > 25) {
          if (Math.random() > 0.5) playTick();
        } else playTick();
      }, 200);

      setRotation(finalRotation);

      setTimeout(() => {
        clearInterval(tickInterval);
        playWin();
        resolve(finalRotation);
      }, duration * 1000);
    });
  };

  const startDrawSequence = async () => {
    setWinners([]);
    setFairnessCode(null);
    const drawn = session.drawWinners();
    if (drawn.length === 0) return;
    setIsDrawing(true);
    const collected: LotteryItem[] = [];
    let curRot = rotation;
    const duration = drawn.length > 1 ? 4 : 6;

    for (const w of drawn) {
      curRot = await spinOnce(w, curRot, duration);
      collected.push(w);
      setWinners([...collected]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      await new Promise((r) => setTimeout(r, 400));
    }

    const code = await session.recordWinners(collected);
    if (code) setFairnessCode(code);
    setIsDrawing(false);
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

  const createSlicePath = (startAngle: number, endAngle: number) => {
    if (endAngle - startAngle === 360) {
      return 'M 100,0 A 100,100 0 1,1 99.9,0 Z';
    }
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = 100 + 100 * Math.cos(startRad);
    const y1 = 100 + 100 * Math.sin(startRad);
    const x2 = 100 + 100 * Math.cos(endRad);
    const y2 = 100 + 100 * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M 100,100 L ${x1},${y1} A 100,100 0 ${largeArcFlag},1 ${x2},${y2} Z`;
  };

  const fontSize = items.length > 30 ? 4 : items.length > 20 ? 5 : items.length > 12 ? 7 : 10;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 p-4">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl">
          請先在左側輸入抽獎名單
        </div>
      ) : (
        <div className="relative w-80 h-80 sm:w-96 sm:h-96">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 drop-shadow-lg">
            <div
              className="w-8 h-12 bg-white"
              style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}
            ></div>
          </div>
          <motion.div
            className="w-full h-full rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-gray-800 relative overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ duration: 6, ease: [0.1, 0.95, 0.25, 1] }}
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
              {slices.map((slice, i) => {
                const angle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
                return (
                  <g key={`text-${i}`} transform={`translate(100, 100) rotate(${angle - 90})`}>
                    <text
                      x="55"
                      y="3"
                      fill="white"
                      fontSize={fontSize}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="drop-shadow-md"
                    >
                      {truncateForWheel(slice.item.name, items.length)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleStart}
          disabled={isDrawing || items.length === 0}
          className={clsx(
            'group relative flex items-center justify-center gap-2 px-8 py-4 text-2xl font-black tracking-wider text-white uppercase transition-all duration-200 rounded-full',
            isDrawing || items.length === 0
              ? 'bg-gray-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.5)] active:scale-95'
          )}
        >
          <Play className="w-8 h-8" fill="currentColor" />
          {isDrawing
            ? '轉動中...'
            : session.drawCount > 1
            ? `轉盤 (${session.drawCount} 位)`
            : '開始轉盤'}
        </button>

        {session.currentTier && !isDrawing && (
          <div className="text-sm text-amber-200">
            🏆 本輪：<span className="font-bold">{session.currentTier.name}</span>
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
                {winners.map((w, i) => (
                  <span
                    key={w.id + i}
                    className="px-3 py-1 bg-emerald-700/60 border border-emerald-500 rounded-full text-white font-medium"
                  >
                    {w.name}
                  </span>
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
          count={session.drawCount}
          tierName={session.currentTier?.name}
          onConfirm={session.confirmStart}
          onCancel={session.cancelStart}
        />
      )}
    </div>
  );
}
