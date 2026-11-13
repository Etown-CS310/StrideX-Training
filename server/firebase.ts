import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// The key file is never committed. Its path can be changed with FIREBASE_SERVICE_ACCOUNT in .env
const keyPath = resolve(process.env.FIREBASE_SERVICE_ACCOUNT ?? 'serviceAccount.json');

let serviceAccount: ServiceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error('Could not read the Firebase service account key at ' + keyPath);
  console.error('Download it from Firebase console > Project settings > Service accounts.');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore();
