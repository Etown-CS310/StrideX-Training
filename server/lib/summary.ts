import type { ActivityJson } from './activityData.ts';

export const PERIODS = ['week', 'month'] as const;
export type Period = (typeof PERIODS)[number];

export const GOAL_METRICS = ['distance', 'duration', 'activityCount'] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export interface PeriodRange {
  period: Period;
  /** First local day of the period, YYYY-MM-DD */
  startDate: string;
  /** Inclusive start as an ISO instant */
  start: string;
  /** Exclusive end as an ISO instant */
  end: string;
}

export interface TypeTotals {
  activityCount: number;
  distance: number;
  duration: number;
}

export interface Totals extends TypeTotals {
  elevation: number;
  calories: number;
  /** Duration-weighted average heart rate, null if no activity had one */
  hrAvg: number | null;
  byType: Record<string, TypeTotals>;
}

export interface Goal {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  period: Period;
  activityType: string | null;
  appliesTo: 'team' | 'each';
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TZ_OFFSET = 14 * 60;

/**
 * Reads ?period, ?date and ?tzOffset. tzOffset is the browser's Date.getTimezoneOffset()
 * (minutes, e.g. 300 for US Eastern) so "this week" lines up with the user's calendar.
 * @returns The parsed values, or an error message.
 */
export function parsePeriodQuery(query: Record<string, unknown>):
  { period: Period; date: string; tzOffset: number } | { error: string } {
  const tzRaw = query.tzOffset ?? '0';
  const tzOffset = Number(tzRaw);
  if (typeof tzRaw !== 'string' || tzRaw.trim() === '' || !Number.isInteger(tzOffset) || Math.abs(tzOffset) > MAX_TZ_OFFSET) {
    return { error: 'tzOffset must be a whole number of minutes between -840 and 840' };
  }

  const period = query.period ?? 'week';
  if (typeof period !== 'string' || !(PERIODS as readonly string[]).includes(period)) {
    return { error: 'period must be week or month' };
  }

  // Default to today in the user's time zone
  const date = query.date ?? new Date(Date.now() - tzOffset * 60_000).toISOString().slice(0, 10);
  if (typeof date !== 'string' || parseDate(date) == null) {
    return { error: 'date must be YYYY-MM-DD' };
  }

  return { period: period as Period, date: date, tzOffset: tzOffset };
}

/** Returns [year, monthIndex, day] for a valid YYYY-MM-DD string, otherwise null. */
function parseDate(date: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match == null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month || check.getUTCDate() !== day) return null;
  return [year, month, day];
}

/**
 * The week (Monday to Sunday) or calendar month that contains the date, in the user's time zone.
 * Uses a fixed offset, so a period that crosses a daylight saving change can be off by an hour.
 */
export function periodRange(period: Period, date: string, tzOffset: number): PeriodRange {
  const [year, month, day] = parseDate(date) ?? [1970, 0, 1];
  let startUtc: number;
  let endUtc: number;
  if (period === 'week') {
    const daysSinceMonday = (new Date(Date.UTC(year, month, day)).getUTCDay() + 6) % 7;
    startUtc = Date.UTC(year, month, day - daysSinceMonday);
    endUtc = startUtc + 7 * DAY_MS;
  } else {
    startUtc = Date.UTC(year, month, 1);
    endUtc = Date.UTC(year, month + 1, 1);
  }
  const shift = tzOffset * 60_000;
  return {
    period: period,
    startDate: new Date(startUtc).toISOString().slice(0, 10),
    start: new Date(startUtc + shift).toISOString(),
    end: new Date(endUtc + shift).toISOString(),
  };
}

/**
 * Activities whose start time is in [start, end). Activities with no start time are left out.
 * Either bound can be null for an open range.
 */
export function activitiesInRange(activities: ActivityJson[], start: string | null, end: string | null): ActivityJson[] {
  const from = start == null ? -Infinity : Date.parse(start);
  const to = end == null ? Infinity : Date.parse(end);
  return activities.filter((activity) => {
    if (activity.startTime == null) return false;
    const time = Date.parse(activity.startTime);
    return time >= from && time < to;
  });
}

/**
 * Adds up a list of activities. Distances are meters, durations seconds.
 */
export function summarize(activities: ActivityJson[]): Totals {
  const totals: Totals = {
    activityCount: 0, distance: 0, duration: 0, elevation: 0, calories: 0, hrAvg: null, byType: {},
  };
  let hrSum = 0;
  let hrWeight = 0;

  for (const activity of activities) {
    totals.activityCount += 1;
    totals.distance += activity.distance ?? 0;
    totals.duration += activity.duration ?? 0;
    totals.elevation += activity.elevation ?? 0;
    totals.calories += activity.calories ?? 0;

    if (activity.hrAvg != null) {
      // Longer workouts count more toward the average; activities without a duration count as 1
      const weight = activity.duration != null && activity.duration > 0 ? activity.duration : 1;
      hrSum += activity.hrAvg * weight;
      hrWeight += weight;
    }

    const type = activity.type || 'other';
    const byType = totals.byType[type] ?? { activityCount: 0, distance: 0, duration: 0 };
    byType.activityCount += 1;
    byType.distance += activity.distance ?? 0;
    byType.duration += activity.duration ?? 0;
    totals.byType[type] = byType;
  }

  totals.hrAvg = hrWeight > 0 ? Math.round((hrSum / hrWeight) * 10) / 10 : null;
  return totals;
}

/**
 * How far the activities get toward a goal's metric (only counting the goal's activity type, if set).
 */
export function goalValue(goal: Goal, activities: ActivityJson[]): number {
  const matching = goal.activityType == null ? activities : activities.filter((a) => a.type === goal.activityType);
  return summarize(matching)[goal.metric];
}
