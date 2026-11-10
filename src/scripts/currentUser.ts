/**
 * The one place the app decides whose data it is reading and writing.
 *
 * There is no login yet, so every activity belongs to the seeded "demo-user"
 * (see seedData.ts). Once Firebase Auth is set up, replace the body with the
 * signed-in user's uid, for example:
 *
 *   import { getAuth } from 'firebase/auth';
 *   const user = getAuth().currentUser;
 *   if (user == null) throw new Error('Not logged in');
 *   return user.uid;
 *
 * uploadActivity and loadActivities both call this, so nothing else needs to change.
 */
export function getCurrentUserId(): string {
  return 'demo-user';
}
