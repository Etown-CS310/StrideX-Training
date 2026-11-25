import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase.ts";
import { createJoinCode } from "./lib/teamAccess.ts";

/**
 * Seeds Firestore with a demo team (coach, athlete, weekly goal) and one activity with a lap.
 * Demo users have no password, so they can't log in; they're only sample data.
 * @returns A promise that resolves once all documents have been written.
 */
async function seed(): Promise<void> {
  const team = await db.collection("teams").add({
    name: "Demo Team",
    description: "Seed team",
    coachId: "demo-coach",
    joinCode: await createJoinCode(),
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection("users").doc("demo-coach").set({
    name: "Demo Coach",
    isCoach: true,
    teamId: team.id,
  });

  await db.collection("users").doc("demo-user").set({
    name: "Demo Athlete",
    isCoach: false,
    teamId: team.id,
  });

  await team.collection("goals").add({
    title: "Run 20 km as a team",
    metric: "distance", target: 20000, period: "week",
    activityType: "run", appliesTo: "team",
    createdBy: "demo-coach",
    createdAt: FieldValue.serverTimestamp(),
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
