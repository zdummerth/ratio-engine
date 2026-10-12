import { describe, expect, it } from 'vitest';
import { roundTo } from '@/lib/stats/rounding';

describe('roundTo', () => {
  it('rounds to the requested number of decimals', () => {
    expect(roundTo(1.23456, 4)).toBe(1.2346);
    expect(roundTo(12.344, 2)).toBe(12.34);
  });

  it('is not fooled by binary representation', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(1.00005, 4)).toBe(1.0001);
  });

  it('rounds half away from zero', () => {
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(roundTo(-0.00005, 4)).toBe(-0.0001);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundTo(-0.00001, 4), 0)).toBe(true);
  });

  it('rejects invalid input', () => {
    expect(() => roundTo(Number.NaN, 2)).toThrow(RangeError);
    expect(() => roundTo(1, -1)).toThrow(RangeError);
  });
});
