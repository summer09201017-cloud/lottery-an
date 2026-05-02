export interface LotteryItem {
  id: string;
  name: string;
  weight: number;
}

export class RandomEngine {
  /**
   * Generates a random number between 0 and 1 using Web Crypto API for better randomness
   */
  static getRandom(): number {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }

  /**
   * Selects an item based on their weights
   */
  static drawWeighted(items: LotteryItem[]): LotteryItem | null {
    if (!items || items.length === 0) return null;

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let randomValue = this.getRandom() * totalWeight;

    for (const item of items) {
      randomValue -= item.weight;
      if (randomValue <= 0) {
        return item;
      }
    }

    // Fallback to the last item just in case of floating point inaccuracies
    return items[items.length - 1];
  }
}
