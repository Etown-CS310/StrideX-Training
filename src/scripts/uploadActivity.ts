import type { ActivityUpload } from './activityMapper';
import { apiFetch } from './api';

/**
 * Saves one activity and its laps for the logged in user with POST /api/activities.
 * @returns The new activity's id.
 */
export async function uploadActivity(upload: ActivityUpload): Promise<string> {
  const result = await apiFetch<{ activity: { id: string } }>('/activities', 'POST', {
    activity: upload.activity,
    laps: upload.laps,
    notes: upload.notes ?? '',
  });
  return result.activity.id;
}
