import { describe, it, expect } from 'vitest';
import { MockStockProvider, TRACKED_SYMBOLS } from './mock-stock.provider';

describe('MockStockProvider', () => {
  const provider = new MockStockProvider();

  describe('list()', () => {
    it('should return the deterministic tracked stock list with the expected shape', async () => {
      const stocks = await provider.list();

      expect(stocks).toHaveLength(TRACKED_SYMBOLS.length);
      for (const stock of stocks) {
        expect(stock).toHaveProperty('symbol');
        expect(stock).toHaveProperty('name');
        expect(stock).toHaveProperty('currentPrice');
        expect(stock).toHaveProperty('changePercent');
        expect(typeof stock.symbol).toBe('string');
        expect(typeof stock.name).toBe('string');
        expect(typeof stock.currentPrice).toBe('number');
        expect(typeof stock.changePercent).toBe('number');
      }
    });

    it('should return AAPL as the first item', async () => {
      const stocks = await provider.list();
      expect(stocks[0].symbol).toBe('AAPL');
      expect(stocks[0].name).toBe('Apple Inc.');
    });
  });

  describe('chart()', () => {
    it('should return 7 chart points for a known symbol', async () => {
      const points = await provider.chart('AAPL', '1W');

      expect(points).toHaveLength(7);
      for (const point of points) {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('open');
        expect(point).toHaveProperty('high');
        expect(point).toHaveProperty('low');
        expect(point).toHaveProperty('close');
        expect(typeof point.timestamp).toBe('string');
        expect(typeof point.open).toBe('number');
        expect(typeof point.high).toBe('number');
        expect(typeof point.low).toBe('number');
        expect(typeof point.close).toBe('number');
        expect(point.high).toBeGreaterThanOrEqual(point.low);
        expect(point.high).toBeGreaterThanOrEqual(point.open);
        expect(point.high).toBeGreaterThanOrEqual(point.close);
        expect(point.low).toBeLessThanOrEqual(point.open);
        expect(point.low).toBeLessThanOrEqual(point.close);
      }
    });

    it('should return an empty array for an unknown symbol', async () => {
      const points = await provider.chart('UNKNOWN', '1W');
      expect(points).toEqual([]);
    });
  });
});
