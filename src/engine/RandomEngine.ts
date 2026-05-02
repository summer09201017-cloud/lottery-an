export interface LotteryItem {
  id: string;
  name: string;
  weight: number;
  group?: string;
  imageUrl?: string;
}

export interface DrawOptions {
  count?: number;
  blacklist?: string[];
  forcedWinnerId?: string | null;
  noRepeat?: boolean;
}

export class RandomEngine {
  /** Crypto-strong random in [0, 1) */
  static getRandom(): number {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }

  /** Single weighted draw */
  static drawWeighted(items: LotteryItem[]): LotteryItem | null {
    if (!items || items.length === 0) return null;
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) return items[Math.floor(this.getRandom() * items.length)];
    let randomValue = this.getRandom() * totalWeight;
    for (const item of items) {
      randomValue -= item.weight;
      if (randomValue <= 0) return item;
    }
    return items[items.length - 1];
  }

  /**
   * Draw N winners with optional blacklist + forced winner.
   * - blacklist: ids that cannot be picked
   * - forcedWinnerId: must be the FIRST winner (if eligible)
   * - noRepeat: same person cannot win twice (default true)
   */
  static drawMultiple(
    items: LotteryItem[],
    options: DrawOptions = {}
  ): LotteryItem[] {
    const { count = 1, blacklist = [], forcedWinnerId = null, noRepeat = true } = options;
    if (!items || items.length === 0) return [];

    let pool = items.filter((i) => !blacklist.includes(i.id));
    const winners: LotteryItem[] = [];

    // Forced winner first
    if (forcedWinnerId) {
      const forced = pool.find((i) => i.id === forcedWinnerId);
      if (forced) {
        winners.push(forced);
        if (noRepeat) pool = pool.filter((i) => i.id !== forced.id);
      }
    }

    while (winners.length < count && pool.length > 0) {
      const w = this.drawWeighted(pool);
      if (!w) break;
      winners.push(w);
      if (noRepeat) pool = pool.filter((i) => i.id !== w.id);
    }
    return winners;
  }

  /** SHA-256 fairness code (last 8 hex chars) */
  static async fairnessCode(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const buf = await window.crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(-8).toUpperCase();
  }
}
