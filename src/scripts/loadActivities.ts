import type { ActivityData } from './activityMapper';
import { apiFetch } from './api';

export interface Activity extends ActivityData {
  id: string;
  notes: string;
}

// Dates arrive from the API as ISO strings
type ActivityJson = Omit<Activity, 'startTime'> & { startTime: string | null };

/**
 * Gets every activity for the logged in user with GET /api/activities.
 * @returns The user's activities, oldest first.
 */
export async function loadActivities(): Promise<Activity[]> {
  const result = await apiFetch<{ activities: ActivityJson[] }>('/activities');

  return result.activities.map((activity) => ({
    ...activity,
    startTime: activity.startTime == null ? null : new Date(activity.startTime),
  }));
}

// Convert dates to YYYY-MM-DD string
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}
