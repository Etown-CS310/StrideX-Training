import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';
import type { Activity } from './loadActivities';

export type ActivityChanges = Partial<Omit<Activity, 'id'>>;

/**
 * Saves edited fields of an existing activity to Firestore.
 * Only the fields passed in are changed, everything else is left alone.
 */
export async function updateActivity(id: string, changes: ActivityChanges): Promise<void> {
  await updateDoc(doc(db, 'activities', id), changes);
}
