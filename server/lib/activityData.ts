import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '../firebase.ts';
import { isDocId } from './docId.ts';

/**
 * An activity as the API returns it (timestamps are ISO strings).
 */
export interface ActivityJson {
  id: string;
  type: string;
  workoutType: string | null;
  title: string;
  startTime: string | null;
  distance: number | null;
  duration: number | null;
  hrAvg: number | null;
  hrMax: number | null;
  elevation: number | null;
  calories: number | null;
  cadence: number | null;
  power: number | null;
  notes: string;
}

/**
 * Turns a Firestore activity document into JSON (timestamps become ISO strings).
 */
export function activityToJson(doc: DocumentSnapshot): ActivityJson {
  const data = doc.data() ?? {};
  const startTime = data.startTime instanceof Timestamp ? data.startTime.toDate().toISOString() : null;
  return {
    id: doc.id,
    type: data.type,
    workoutType: data.workoutType ?? null,
    title: data.title,
    startTime: startTime,
    distance: data.distance ?? null,
    duration: data.duration ?? null,
    hrAvg: data.hrAvg ?? null,
    hrMax: data.hrMax ?? null,
    elevation: data.elevation ?? null,
    calories: data.calories ?? null,
    cadence: data.cadence ?? null,
    power: data.power ?? null,
    notes: data.notes ?? '',
  };
}

/**
 * Loads every activity of a user, oldest first.
 * Date filtering is done by the caller in memory, so Firestore needs no composite index.
 */
export async function loadUserActivities(userId: string): Promise<ActivityJson[]> {
  const snapshot = await db.collection('activities').where('userId', '==', userId).get();
  const activities = snapshot.docs.map(activityToJson);
  activities.sort((a, b) => String(a.startTime ?? '').localeCompare(String(b.startTime ?? '')));
  return activities;
}

/**
 * Loads an activity that belongs to the user, or null if it doesn't exist or isn't theirs.
 * Other users' activities are treated as missing so their ids can't be probed.
 */
export async function findUserActivity(id: string, userId: string): Promise<DocumentSnapshot | null> {
  if (!isDocId(id)) return null;
  const doc = await db.collection('activities').doc(id).get();
  if (!doc.exists || doc.get('userId') !== userId) return null;
  return doc;
}

/**
 * Loads the laps stored under an activity document.
 */
export async function loadLaps(doc: DocumentSnapshot): Promise<Record<string, unknown>[]> {
  const lapSnapshot = await doc.ref.collection('laps').get();
  return lapSnapshot.docs.map((lap) => ({ id: lap.id, ...lap.data() }));
}
