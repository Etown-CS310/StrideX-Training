import { apiFetch } from './api';
import type { Activity } from './loadActivities';

export type ActivityChanges = Partial<Omit<Activity, 'id'>>;

/**
 * Saves edited fields of an existing activity with PATCH /api/activities/:id.
 * Only the fields passed in are changed, everything else is left alone.
 */
export async function updateActivity(id: string, changes: ActivityChanges): Promise<void> {
  await apiFetch('/activities/' + encodeURIComponent(id), 'PATCH', changes);
}
