import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebase';
import type { ActivityUpload } from './activityMapper';

// No login yet, so everything goes to the seeded demo user
const USER_ID = 'demo-user';

/**
 * Saves one activity to Firestore, then saves its laps in the activity's "laps" subcollection.
 * @returns The new activity's document id.
 */
export async function uploadActivity(upload: ActivityUpload): Promise<string> {
  const activityRef = await addDoc(collection(db, 'activities'), {
    ...upload.activity,
    userId: USER_ID,
    notes: '',
    createdAt: serverTimestamp(),
  });

  for (const lap of upload.laps) {
    await addDoc(collection(db, 'activities', activityRef.id, 'laps'), {
      ...lap,
      activityId: activityRef.id,
      notes: '',
    });
  }

  return activityRef.id;
}
