import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { RandomEngine } from '../engine/RandomEngine';
import type { LotteryItem } from '../engine/RandomEngine';

/**
 * Shared draw-session hook that all modes use.
 * Handles: prize tier selection, multi-winner, blacklist/forced winner,
 * fairness code, history recording, congrats template formatting.
 */
export function useDrawSession() {
  const {
    items,
    settings,
    blacklist,
    forcedWinnerId,
    prizeTiers,
    activePrizeTierId,
    addHistory,
    markTierDone,
    setActivePrizeTier,
  } = useAppStore();

  const [pendingConfirm, setPendingConfirm] = useState<null | (() => void)>(null);

  const getDrawCount = useCallback(() => {
    if (activePrizeTierId) {
      const tier = prizeTiers.find((t) => t.id === activePrizeTierId);
      if (tier) return tier.count;
    }
    return Math.max(1, settings.drawCount || 1);
  }, [activePrizeTierId, prizeTiers, settings.drawCount]);

  const formatCongrats = useCallback(
    (winner: LotteryItem) => {
      const tierName = activePrizeTierId
        ? prizeTiers.find((t) => t.id === activePrizeTierId)?.name ?? ''
        : '';
      return settings.congratsTemplate
        .replace('{name}', winner.name)
        .replace('{prize}', tierName || '大獎');
    },
    [settings.congratsTemplate, activePrizeTierId, prizeTiers]
  );

  const drawWinners = useCallback((): LotteryItem[] => {
    const count = getDrawCount();
    return RandomEngine.drawMultiple(items, {
      count,
      blacklist,
      forcedWinnerId,
      noRepeat: true,
    });
  }, [items, blacklist, forcedWinnerId, getDrawCount]);

  const recordWinners = useCallback(
    async (winners: LotteryItem[]) => {
      const tier = activePrizeTierId
        ? prizeTiers.find((t) => t.id === activePrizeTierId)
        : undefined;

      let fairnessCode: string | undefined;
      if (settings.fairnessMode) {
        const payload =
          new Date().toISOString() +
          '|' +
          winners.map((w) => w.id).join(',') +
          '|' +
          items.map((i) => i.id).join(',');
        fairnessCode = await RandomEngine.fairnessCode(payload);
      }

      const entries = winners.map((w) => ({
        id: w.id,
        name: w.name,
        date: new Date().toISOString(),
        prizeTier: tier?.name,
        fairnessCode,
      }));
      addHistory(entries);

      if (activePrizeTierId) {
        markTierDone(activePrizeTierId);
        setActivePrizeTier(null);
      }
      return fairnessCode;
    },
    [
      activePrizeTierId,
      prizeTiers,
      settings.fairnessMode,
      items,
      addHistory,
      markTierDone,
      setActivePrizeTier,
    ]
  );

  const requestStart = useCallback(
    (run: () => void) => {
      if (settings.confirmBeforeDraw) {
        setPendingConfirm(() => run);
      } else {
        run();
      }
    },
    [settings.confirmBeforeDraw]
  );

  const confirmStart = useCallback(() => {
    if (pendingConfirm) {
      pendingConfirm();
      setPendingConfirm(null);
    }
  }, [pendingConfirm]);

  const cancelStart = useCallback(() => setPendingConfirm(null), []);

  return {
    drawCount: getDrawCount(),
    formatCongrats,
    drawWinners,
    recordWinners,
    requestStart,
    pendingConfirm: !!pendingConfirm,
    confirmStart,
    cancelStart,
    currentTier: activePrizeTierId
      ? prizeTiers.find((t) => t.id === activePrizeTierId)
      : null,
    hasForced: !!forcedWinnerId,
    blacklistCount: blacklist.length,
  };
}
