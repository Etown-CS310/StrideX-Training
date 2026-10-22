import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '../firebase';
import type { ActivityData } from './activityMapper';
import { USER_ID } from './uploadActivity';

export interface Activity extends ActivityData {
  id: string;
  notes: string;
}

/**
 * Gets every activity for the current user.
 * Only filters on userId, so Firestore doesn't need a composite index.
 * @returns The user's activities, oldest first.
 */
export async function loadActivities(): Promise<Activity[]> {
  const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', USER_ID));
  const snapshot = await getDocs(activitiesQuery);

  const activities: Activity[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Firestore gives back a timestamp instead of a date
    let startTime: Date | null = null;
    if (data.startTime != null) {
      startTime = data.startTime.toDate();
    }

    activities.push({
      id: doc.id,
      type: data.type,
      title: data.title,
      startTime: startTime,
      distance: data.distance,
      duration: data.duration,
      hrAvg: data.hrAvg,
      hrMax: data.hrMax,
      elevation: data.elevation,
      calories: data.calories,
      cadence: data.cadence,
      power: data.power,
      notes: data.notes ?? '',
    });
  }

  activities.sort((a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0));
  return activities;
}

// Convert dates to YYYY-MM-DD string
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}
