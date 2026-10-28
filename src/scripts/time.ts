/**
 * Converts hours, minutes, seconds, and centiseconds to total centiseconds.
 * @param h - Hours (can be null)
 * @param m - Minutes (can be null)
 * @param s - Seconds (can be null)
 * @param cs - Centiseconds (can be null)
 * @returns Total seconds as a number.
 */
export const toSeconds = (h: number | null, m: number | null, s: number | null, cs: number | null) =>
  (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0) + (cs ?? 0) / 100;

/**
 * Converts total seconds to an object containing hours, minutes, seconds, and centiseconds.
 * @param total - Total seconds as a number.
 * @returns An object with hours, minutes, seconds, and centiseconds.
 */
export const fromSeconds = (total: number) => ({
  hours: Math.floor(total / 3600),
  minutes: Math.floor(total / 60) % 60,
  seconds: Math.floor(total) % 60,
  centiseconds: Math.round((total % 1) * 100),
});

/**
 * Formats a duration given in seconds into a string in the format "hh:mm:ss.cc".
 * @param total - Total seconds as a number.
 * @returns A formatted string representing the duration.
 */
export const formatDuration = (total: number) => {
  const { hours, minutes, seconds, centiseconds } = fromSeconds(total);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
};