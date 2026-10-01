import { readFileSync } from "node:fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

// ESM has no `require`, so read the key file relative to this script instead
const serviceAccount: ServiceAccount = JSON.parse(
  readFileSync(new URL("../../serviceAccount.json", import.meta.url), "utf8"),
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/**
 * Seeds Firestore with a demo team, a demo athlete, and one activity with a lap.
 * @returns A promise that resolves once all documents have been written.
 */
async function seed(): Promise<void> {
  const team = await db.collection("teams").add({
    name: "Demo Team",
    description: "Seed team",
  });

  await db.collection("users").doc("demo-user").set({
    name: "Demo Athlete",
    isCoach: false,
    teamId: team.id,
  });

  const activity = await db.collection("activities").add({
    userId: "demo-user",
    type: "run",
    title: "Morning run",
    startTime: Timestamp.now(),
    distance: 5000, duration: 1500,      // meters, seconds, until specified otherwise
    hrAvg: 150, hrMax: 172,
    elevation: 40, calories: 350, cadence: 170, power: null,
    notes: "",
    createdAt: FieldValue.serverTimestamp(),
  });

  await activity.collection("laps").add({
    type: "run", distance: 1000, duration: 300,
    hrAvg: 145, hrMax: 160, notes: "",
  });

  console.log("Seeded.");
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
