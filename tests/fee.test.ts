import { calculateFeeCents } from '../src/services/fee';

describe('Fee calculation', () => {
  it('rounds up partial hours and applies base', () => {
    const entry = new Date('2025-01-01T10:00:00Z');
    const exit1 = new Date('2025-01-01T10:10:00Z');
    const exit2 = new Date('2025-01-01T11:00:00Z');

    expect(calculateFeeCents('MOTORCYCLE', entry, exit1)).toBe(50 + 100 * 1);
    expect(calculateFeeCents('CAR', entry, exit2)).toBe(100 + 200 * 1);
  });
});
