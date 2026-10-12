/**
 * Rounds half away from zero to a fixed number of decimal places.
 *
 * Uses exponent notation for the shift so values such as 1.005 round to 1.01
 * instead of falling victim to binary floating-point representation.
 */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`cannot round non-finite value ${value}`);
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError(`decimals must be a non-negative integer, got ${decimals}`);
  }
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value);
  const text = String(magnitude);
  const rounded = text.includes('e')
    ? Math.round(magnitude * 10 ** decimals) / 10 ** decimals
    : Number(`${Math.round(Number(`${text}e${decimals}`))}e-${decimals}`);
  const result = sign * rounded;
  return Object.is(result, -0) ? 0 : result;
}
