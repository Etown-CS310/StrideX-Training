/**
 * Converts a raw input string to a number clamped to [0, max].
 * @param raw - The raw string value from the input.
 * @param max - Optional maximum allowed value.
 * @returns The clamped number, or null if the input is empty.
 */
export const clampNumberInput = (raw: string, max?: number) => {
  if (raw === '') return null;
  const value = Math.max(Number(raw), 0);
  return max !== undefined ? Math.min(value, max) : value;
};