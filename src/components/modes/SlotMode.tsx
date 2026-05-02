import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import type { LotteryItem } from '../../engine/RandomEngine';
import { RandomEngine } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useDrawSession } from '../../hooks/useDrawSession';
import { CountdownOverlay } from './CountdownOverlay';
import { ConfirmDialog } from './ConfirmDialog';
import { Play } from 'lucide-react';
import { clsx } from 'clsx';

const ITEM_HEIGHT = 80;

interface ColumnResult {
  itemId: string;
  match: boolean;
}

export function SlotMode() {
  const { items, settings } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  const session = useDrawSession();

  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<LotteryItem[]>([]);
  const [columnResults, setColumnResults] = useState<ColumnResult[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [fairnessCode, setFairnessCode] = useState<string | null>(null);

  const controls1 = useAnimation();
  const controls2 = useAnimation();
  const controls3 = useAnimation();
  const controls = [controls1, controls2, controls3];

  const slotItems = Array.from({ length: 60 }).flatMap(() => items);

  const spinForWinner = async (winner: LotteryItem | null, allowFakeColumns: boolean) => {
    // For real winners, all 3 columns land on winner.
    // When showing a "near miss" (no winner this round), 2 cols match, 1 random.
    const targetIndices: number[] = [];
    const colWinnerIds: string[] = [];

    for (let col = 0; col < 3; col++) {
      let target: LotteryItem | null = winner;
      if (allowFakeColumns && col === 2 && Math.random() < 0.6) {
        // create near-miss on 3rd column
        const others = items.filter((i) => i.id !== winner?.id);
        target = others[Math.floor(Math.random() * others.length)] ?? winner;
      }
      colWinnerIds.push(target?.id ?? items[0].id);
      const idx = items.findIndex((i) => i.id === (target?.id ?? items[0].id));
      const baseRevs = 30 + col * 10;
      targetIndices.push(baseRevs * items.length + idx);
    }

    const targetYs = targetIndices.map((idx) => -(idx * ITEM_HEIGHT) + ITEM_HEIGHT);
    const durations = [4, 5.5, 7];

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount > 25) {
        if (Math.random() > 0.5) playTick();
      } else playTick();
    }, 150);

    controls.forEach((c) =>
      c.start({ y: 20, transition: { duration: 0.3, ease: 'easeOut' } })
    );

    await Promise.all(
      controls.map((c, i) =>
        c.start({
          y: targetYs[i],
          transition: { duration: durations[i], ease: [0.1, 0.95, 0.25, 1] },
        })
      )
    );
    clearInterval(tickInterval);

    return colWinnerIds;
  };

  const startDrawSequence = async () => {
    setWinners([]);
    setColumnResults([]);
    setFairnessCode(null);
    const drawn = session.drawWinners();
    if (drawn.length === 0) return;

    setIsDrawing(true);
    const collected: LotteryItem[] = [];

    for (let idx = 0; idx < drawn.length; idx++) {
      const w = drawn[idx];
      // Reset reels
      controls.forEach((c) => c.set({ y: ITEM_HEIGHT }));
      await new Promise((r) => setTimeout(r, 100));

      const colIds = await spinForWinner(w, false);
      const allMatch = colIds.every((id) => id === w.id);
      collected.push(w);
      setWinners([...collected]);
      setColumnResults(colIds.map((id) => ({ itemId: id, match: allMatch })));

      playWin();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#fcd34d', '#fbbf24', '#f59e0b', '#ef4444'],
      });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

      if (idx < drawn.length - 1) await new Promise((r) => setTimeout(r, 800));
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

  // "Try luck" near-miss demo — show 777 logic when only single mode + tier=null
  const tryLuck = async () => {
    if (items.length === 0 || isDrawing) return;
    setIsDrawing(true);
    setWinners([]);
    setColumnResults([]);
    controls.forEach((c) => c.set({ y: ITEM_HEIGHT }));
    await new Promise((r) => setTimeout(r, 100));
    const candidate = RandomEngine.drawWeighted(items);
    if (!candidate) {
      setIsDrawing(false);
      return;
    }
    const colIds = await spinForWinner(candidate, true);
    const allMatch = colIds.every((id) => id === candidate.id);
    setColumnResults(colIds.map((id) => ({ itemId: id, match: allMatch })));
    if (allMatch) {
      setWinners([candidate]);
      playWin();
      await session.recordWinners([candidate]);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    } else {
      playTick();
    }
    setIsDrawing(false);
  };

  useEffect(() => {
    controls.forEach((c) => c.set({ y: ITEM_HEIGHT }));
    setWinners([]);
    setColumnResults([]);
  }, [items.length]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 p-4">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl">
          請先在左側輸入抽獎名單
        </div>
      ) : (
        <div className="relative w-full max-w-3xl h-[240px] bg-gray-900 border-[8px] border-gray-800 rounded-2xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/80 via-transparent to-black/80" />
          <div
            className={clsx(
              'absolute top-1/2 left-0 right-0 h-1 z-20 -translate-y-1/2 pointer-events-none transition-colors',
              columnResults.length > 0 && columnResults.every((c) => c.match)
                ? 'bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,1)]'
                : 'bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,1)]'
            )}
          />
          <div className="flex w-full h-full divide-x divide-gray-800/50">
            {controls.map((control, colIndex) => (
              <div key={colIndex} className="flex-1 relative overflow-hidden">
                <motion.div
                  className="flex flex-col items-center w-full absolute left-0 right-0"
                  animate={control}
                  initial={{ y: ITEM_HEIGHT }}
                >
                  {slotItems.map((item, i) => (
                    <div
                      key={`${item.id}-${colIndex}-${i}`}
                      className="flex items-center justify-center w-full font-bold text-xl sm:text-2xl lg:text-3xl border-b border-gray-800/30 text-gray-200 px-2 truncate"
                      style={{ height: `${ITEM_HEIGHT}px` }}
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

      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isDrawing || items.length === 0}
            className={clsx(
              'flex items-center justify-center gap-2 px-6 py-3 text-xl font-black tracking-wider text-white uppercase transition-all duration-200 rounded-full',
              isDrawing || items.length === 0
                ? 'bg-gray-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-400 hover:to-red-500 hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.5)] active:scale-95'
            )}
          >
            <Play className="w-6 h-6" fill="currentColor" />
            {isDrawing
              ? '拉動中...'
              : session.drawCount > 1
              ? `拉霸 ×${session.drawCount}`
              : '直接抽獎'}
          </button>
          <button
            onClick={tryLuck}
            disabled={isDrawing || items.length === 0}
            className={clsx(
              'flex items-center justify-center gap-2 px-5 py-3 text-base font-bold tracking-wide text-white uppercase rounded-full border-2 transition-all',
              isDrawing || items.length === 0
                ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                : 'bg-gray-900 border-yellow-600 hover:bg-yellow-900/40 hover:scale-105'
            )}
            title="拉霸玩法：三排相同才中獎，否則銘謝惠顧"
          >
            🎰 試手氣
          </button>
        </div>

        {session.currentTier && !isDrawing && (
          <div className="text-sm text-amber-200">
            🏆 本輪：<span className="font-bold">{session.currentTier.name}</span>
          </div>
        )}

        {!isDrawing && columnResults.length > 0 && winners.length === 0 && (
          <div className="text-lg font-bold text-gray-400">😔 銘謝惠顧，再來一次！</div>
        )}

        {winners.length > 0 && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500">
              {winners.length === 1
                ? `🎰 ${session.formatCongrats(winners[0])} 🎰`
                : `🎰 ${winners.length} 連線中獎`}
            </div>
            {winners.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-2xl">
                {winners.map((w, i) => (
                  <span
                    key={w.id + i}
                    className="px-3 py-1 bg-amber-700/60 border border-amber-500 rounded-full text-white font-medium"
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
