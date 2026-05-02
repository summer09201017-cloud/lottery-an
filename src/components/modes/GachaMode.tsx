import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { RandomEngine } from '../../engine/RandomEngine';
import type { LotteryItem } from '../../engine/RandomEngine';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Sparkles, Star } from 'lucide-react';
import { clsx } from 'clsx';

// Helper to determine rarity
function getRarity(weight: number) {
  if (weight > 5) return 'SSR';
  if (weight > 1) return 'SR';
  return 'R';
}

function getRarityStyle(rarity: string) {
  switch (rarity) {
    case 'SSR':
      return {
        bg: 'linear-gradient(135deg, #713f12 0%, #ca8a04 100%)',
        border: 'border-yellow-400',
        shadow: 'shadow-[0_0_50px_rgba(250,204,21,0.8)]',
        text: 'text-yellow-100',
        label: 'SSR 級大獎'
      };
    case 'SR':
      return {
        bg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        border: 'border-slate-300',
        shadow: 'shadow-[0_0_30px_rgba(148,163,184,0.6)]',
        text: 'text-slate-200',
        label: 'SR 級珍品'
      };
    case 'R':
    default:
      return {
        bg: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
        border: 'border-amber-700',
        shadow: 'shadow-[0_0_20px_rgba(180,83,9,0.5)]',
        text: 'text-amber-200',
        label: 'R 級一般'
      };
  }
}

export function GachaMode() {
  const { items, addHistory, settings } = useAppStore();
  const { playTick, playWin } = useSoundEffects();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'single' | 'multi' | null>(null);
  
  // State for single draw
  const [singleResult, setSingleResult] = useState<LotteryItem | null>(null);
  const [isSingleFlipped, setIsSingleFlipped] = useState(false);
  const singleControls = useAnimation();
  const glowControls = useAnimation();

  // State for multi draw
  const [multiResults, setMultiResults] = useState<LotteryItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  
  const startSingleDraw = async () => {
    if (items.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setDrawMode('single');
    setIsSingleFlipped(false);
    setSingleResult(null);
    
    const winningItem = RandomEngine.drawWeighted(items);
    if (!winningItem) return;

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount % 2 === 0) playTick();
    }, 100);

    glowControls.start({
      opacity: [0, 0.5, 0.8, 1],
      scale: [1, 1.2, 1.5, 2],
      transition: { duration: 2.5, ease: "easeIn" }
    });

    await singleControls.start({
      x: [0, -10, 10, -10, 10, -5, 5, -20, 20, 0],
      y: [0, -5, 5, -5, 5, -10, 10, -5, 5, 0],
      rotate: [0, -5, 5, -5, 5, -2, 2, -10, 10, 0],
      scale: [1, 1.05, 1.05, 1.1, 1.1, 1.15, 1.15, 1.2, 1.2, 1],
      transition: { duration: 2.5, ease: "easeInOut" }
    });

    clearInterval(tickInterval);

    setSingleResult(winningItem);
    setIsSingleFlipped(true);
    playWin();
    addHistory(winningItem);
    
    const rarity = getRarity(winningItem.weight);
    if (rarity === 'SSR') {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FFF8DC', '#DAA520']
      });
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
      });
    }
    
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

    setTimeout(() => { setIsDrawing(false); }, 1000);
  };

  const startMultiDraw = async () => {
    if (items.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setDrawMode('multi');
    setFlippedIndices(new Set());
    setMultiResults([]);

    // Determine how many to draw (max 10 or whatever is left if autoExclude)
    const drawCount = Math.min(10, settings.autoExclude ? items.length : 10);
    const results: LotteryItem[] = [];
    
    // Simulate drawing without replacement if autoExclude is true
    let tempItems = [...items];
    for (let i = 0; i < drawCount; i++) {
      if (tempItems.length === 0) break;
      const winner = RandomEngine.drawWeighted(tempItems);
      if (winner) {
        results.push(winner);
        if (settings.autoExclude) {
          tempItems = tempItems.filter(item => item.id !== winner.id);
        }
      }
    }

    if (results.length === 0) {
      setIsDrawing(false);
      return;
    }

    // Play some intro sound/animation
    playTick();
    setMultiResults(results);
    
    // Auto flip them one by one after a short delay
    setIsDrawing(false);
  };

  const flipMultiCard = (index: number) => {
    if (flippedIndices.has(index)) return;
    
    const newSet = new Set(flippedIndices);
    newSet.add(index);
    setFlippedIndices(newSet);
    
    const item = multiResults[index];
    const rarity = getRarity(item.weight);
    
    if (rarity === 'SSR') {
      playWin();
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FFD700', '#FFA500']
      });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else {
      playTick();
    }
    
    addHistory(item);
  };

  const flipAllMulti = () => {
    const newSet = new Set<number>();
    let hasSSR = false;
    
    multiResults.forEach((item, index) => {
      if (!flippedIndices.has(index)) {
        newSet.add(index);
        addHistory(item);
        if (getRarity(item.weight) === 'SSR') hasSSR = true;
      } else {
        newSet.add(index); // keep already flipped
      }
    });
    
    setFlippedIndices(newSet);
    
    if (hasSSR) {
      playWin();
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FFF8DC']
      });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    } else {
      playTick();
    }
  };

  const resetGacha = () => {
    setDrawMode(null);
    setIsSingleFlipped(false);
    setSingleResult(null);
    setMultiResults([]);
    setFlippedIndices(new Set());
    glowControls.set({ opacity: 0, scale: 1 });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 p-4 z-10 relative">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl w-full max-w-2xl">
          請先在左側輸入抽獎名單
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-5xl">
          
          {/* ---- IDLE STATE ---- */}
          {!drawMode && (
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center min-h-[400px]">
              {/* Single Draw Button */}
              <button
                onClick={startSingleDraw}
                disabled={isDrawing || items.length === 0}
                className="group relative flex flex-col items-center justify-center gap-4 w-48 h-64 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl border-4 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:scale-105 transition-all"
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:10px_10px]" />
                <Sparkles className="w-16 h-16 text-yellow-100" />
                <span className="text-2xl font-black text-white drop-shadow-md tracking-widest">單抽</span>
                <span className="text-yellow-100 text-sm font-bold bg-black/20 px-3 py-1 rounded-full">保底金色卡背</span>
              </button>

              {/* Multi Draw Button */}
              <button
                onClick={startMultiDraw}
                disabled={isDrawing || items.length === 0}
                className="group relative flex flex-col items-center justify-center gap-4 w-48 h-64 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl border-4 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-105 transition-all"
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:10px_10px]" />
                <div className="flex -space-x-4">
                  <Star className="w-12 h-12 text-indigo-200" />
                  <Star className="w-12 h-12 text-purple-200" />
                  <Star className="w-12 h-12 text-pink-200" />
                </div>
                <span className="text-2xl font-black text-white drop-shadow-md tracking-widest">多抽</span>
                <span className="text-indigo-100 text-sm font-bold bg-black/20 px-3 py-1 rounded-full">最多 10 連抽</span>
              </button>
            </div>
          )}

          {/* ---- SINGLE DRAW STATE ---- */}
          {drawMode === 'single' && (
            <div className="relative flex flex-col items-center min-h-[450px] justify-center">
              <motion.div 
                className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 rounded-full blur-[100px] z-0 pointer-events-none"
                initial={{ opacity: 0, scale: 1 }}
                animate={glowControls}
              />

              <div className="relative w-72 h-[420px] [perspective:1000px] z-10">
                <motion.div
                  className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-700 ease-out cursor-pointer"
                  animate={singleControls}
                  style={{ rotateY: isSingleFlipped ? 180 : 0 }}
                >
                  {/* Card Back (Golden for Single Draw) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-2xl [backface-visibility:hidden] border-4 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.8)] overflow-hidden flex flex-col items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #a16207 0%, #ca8a04 100%)' }}
                  >
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    <Sparkles className="w-24 h-24 text-yellow-100 drop-shadow-lg" />
                  </div>

                  {/* Card Front */}
                  {singleResult && (
                    <div 
                      className={clsx(
                        "absolute inset-0 w-full h-full rounded-2xl [backface-visibility:hidden] border-4 flex flex-col items-center justify-center p-6 text-center shadow-2xl",
                        getRarityStyle(getRarity(singleResult.weight)).border
                      )}
                      style={{
                        background: getRarityStyle(getRarity(singleResult.weight)).bg,
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className={clsx("text-sm font-bold tracking-widest uppercase mb-6", getRarityStyle(getRarity(singleResult.weight)).text)}>
                        {getRarityStyle(getRarity(singleResult.weight)).label}
                      </div>
                      <div className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-all leading-tight">
                        {singleResult.name}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {/* ---- MULTI DRAW STATE ---- */}
          {drawMode === 'multi' && (
            <div className="flex flex-col items-center w-full gap-6">
              <div className="flex justify-between items-center w-full max-w-4xl px-4">
                <h2 className="text-xl font-bold text-white drop-shadow-md">獲得 {multiResults.length} 項獎品</h2>
                {flippedIndices.size < multiResults.length && (
                  <button 
                    onClick={flipAllMulti}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                  >
                    全部翻開
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-w-5xl justify-items-center">
                {multiResults.map((item, index) => {
                  const isFlipped = flippedIndices.has(index);
                  const rarity = getRarity(item.weight);
                  const style = getRarityStyle(rarity);
                  
                  return (
                    <div key={`${item.id}-${index}`} className="relative w-full aspect-[2/3] max-w-[160px] [perspective:1000px]">
                      <motion.div
                        className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-500 ease-out cursor-pointer"
                        style={{ rotateY: isFlipped ? 180 : 0 }}
                        onClick={() => flipMultiCard(index)}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* Multi Card Back (Standard Purple) */}
                        <div 
                          className="absolute inset-0 w-full h-full rounded-xl [backface-visibility:hidden] border-2 border-indigo-400 shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900"
                        >
                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                          <Star className="w-10 h-10 text-indigo-300" />
                        </div>

                        {/* Multi Card Front */}
                        <div 
                          className={clsx(
                            "absolute inset-0 w-full h-full rounded-xl [backface-visibility:hidden] border-2 flex flex-col items-center justify-center p-3 text-center",
                            style.border,
                            isFlipped ? style.shadow : ''
                          )}
                          style={{
                            background: style.bg,
                            transform: 'rotateY(180deg)'
                          }}
                        >
                          <div className={clsx("text-[10px] font-bold tracking-wider mb-2", style.text)}>
                            {style.label}
                          </div>
                          <div className="text-xl font-black text-white drop-shadow-md break-all leading-tight line-clamp-4">
                            {item.name}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {drawMode && !isDrawing && (
            <div className="mt-8">
              <button
                onClick={resetGacha}
                className="px-8 py-3 bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm text-white rounded-full transition-colors font-bold border border-gray-600 shadow-xl"
              >
                返回重抽
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
