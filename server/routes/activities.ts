import { Router } from 'express';
import { FieldValue, Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '../firebase.ts';
import { requireAuth } from '../auth.ts';

const router = Router();

// Every activity route needs a logged in user
router.use(requireAuth);

const NUMBER_FIELDS = ['distance', 'duration', 'hrAvg', 'hrMax', 'elevation', 'calories', 'cadence', 'power'];
const LAP_NUMBER_FIELDS = ['distance', 'duration', 'hrAvg', 'hrMax'];
const MAX_TITLE_LENGTH = 200;

type Fields = Record<string, unknown>;

/**
 * Checks the fields of an activity and converts them to what Firestore stores.
 * With partial = true (PATCH) only the fields that were sent are checked.
 * @returns The cleaned fields, or an error message.
 */
function validateActivity(body: Fields, partial: boolean): { fields: Fields } | { error: string } {
  const fields: Fields = {};
  const has = (key: string) => key in body;

  if (has('title') || !partial) {
    if (typeof body.title !== 'string' || body.title.trim() === '') return { error: 'title is required' };
    if (body.title.length > MAX_TITLE_LENGTH) return { error: 'title is too long' };
    fields.title = body.title.trim();
  }

  if (has('type') || !partial) {
    if (typeof body.type !== 'string' || body.type.trim() === '') return { error: 'type is required' };
    fields.type = body.type.trim();
  }

  if (has('workoutType')) {
    if (body.workoutType !== null && typeof body.workoutType !== 'string') return { error: 'workoutType must be text or null' };
    fields.workoutType = body.workoutType;
  } else if (!partial) {
    fields.workoutType = null;
  }

  if (has('startTime')) {
    if (body.startTime === null) {
      fields.startTime = null;
    } else {
      const date = new Date(body.startTime as string);
      if (typeof body.startTime !== 'string' || isNaN(date.getTime())) return { error: 'startTime must be an ISO date or null' };
      fields.startTime = Timestamp.fromDate(date);
    }
  } else if (!partial) {
    fields.startTime = null;
  }

  if (has('notes')) {
    if (typeof body.notes !== 'string') return { error: 'notes must be text' };
    fields.notes = body.notes.trim();
  } else if (!partial) {
    fields.notes = '';
  }

  for (const key of NUMBER_FIELDS) {
    if (has(key)) {
      const value = body[key];
      if (value !== null && (typeof value !== 'number' || !isFinite(value) || value < 0)) {
        return { error: key + ' must be a non-negative number or null' };
      }
      fields[key] = value;
    } else if (!partial) {
      fields[key] = null;
    }
  }

  // At least something to show on the calendar
  if (!partial && fields.distance == null && fields.duration == null) {
    return { error: 'distance or duration is required' };
  }

  return { fields: fields };
}

function validateLaps(laps: unknown): { laps: Fields[] } | { error: string } {
  if (laps == null) return { laps: [] };
  if (!Array.isArray(laps)) return { error: 'laps must be an array' };

  const cleaned: Fields[] = [];
  for (const lap of laps) {
    if (lap == null || typeof lap !== 'object') return { error: 'each lap must be an object' };
    const lapFields: Fields = { type: typeof lap.type === 'string' ? lap.type : 'lap', notes: '' };
    for (const key of LAP_NUMBER_FIELDS) {
      const value = lap[key] ?? null;
      if (value !== null && (typeof value !== 'number' || !isFinite(value) || value < 0)) {
        return { error: 'lap ' + key + ' must be a non-negative number or null' };
      }
      lapFields[key] = value;
    }
    cleaned.push(lapFields);
  }
  return { laps: cleaned };
}

/**
 * Turns a Firestore activity document into JSON (timestamps become ISO strings).
 */
function activityToJson(doc: DocumentSnapshot): Fields {
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
 * Loads an activity that belongs to the user, or null if it doesn't exist or isn't theirs.
 * Other users' activities are treated as missing so their ids can't be probed.
 */
async function findOwnActivity(id: string, userId: string): Promise<DocumentSnapshot | null> {
  const doc = await db.collection('activities').doc(id).get();
  if (!doc.exists || doc.get('userId') !== userId) return null;
  return doc;
}

/**
 * GET /api/activities
 * 200 with { activities: [...] } oldest first | 401
 */
router.get('/', async (_req, res) => {
  const snapshot = await db.collection('activities').where('userId', '==', res.locals.userId).get();
  const activities = snapshot.docs.map(activityToJson);
  activities.sort((a, b) => String(a.startTime ?? '').localeCompare(String(b.startTime ?? '')));
  res.status(200).json({ activities: activities });
});

/**
 * GET /api/activities/:id
 * 200 with { activity, laps } | 401 | 404
 */
router.get('/:id', async (req, res) => {
  const doc = await findOwnActivity(req.params.id, res.locals.userId);
  if (doc == null) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }
  const lapSnapshot = await doc.ref.collection('laps').get();
  const laps = lapSnapshot.docs.map((lap) => ({ id: lap.id, ...lap.data() }));
  res.status(200).json({ activity: activityToJson(doc), laps: laps });
});

/**
 * POST /api/activities
 * Body: { activity: {...}, laps?: [...], notes?: string }
 * 201 with { activity } | 400 | 401
 */
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  if (body.activity == null || typeof body.activity !== 'object') {
    res.status(400).json({ error: 'activity object is required' });
    return;
  }

  const checked = validateActivity({ ...body.activity, notes: body.notes ?? '' }, false);
  if ('error' in checked) {
    res.status(400).json({ error: checked.error });
    return;
  }
  const checkedLaps = validateLaps(body.laps);
  if ('error' in checkedLaps) {
    res.status(400).json({ error: checkedLaps.error });
    return;
  }

  // Write the activity and its laps together so a failure can't leave half an activity
  const activityRef = db.collection('activities').doc();
  const batch = db.batch();
  batch.set(activityRef, {
    ...checked.fields,
    userId: res.locals.userId,
    createdAt: FieldValue.serverTimestamp(),
  });
  for (const lap of checkedLaps.laps) {
    batch.set(activityRef.collection('laps').doc(), { ...lap, activityId: activityRef.id });
  }
  await batch.commit();

  res.status(201).json({ activity: activityToJson(await activityRef.get()) });
});

/**
 * PATCH /api/activities/:id
 * Body: any of the activity fields
 * 200 with { activity } | 400 | 401 | 404
 */
router.patch('/:id', async (req, res) => {
  const body = req.body ?? {};
  const checked = validateActivity(body, true);
  if ('error' in checked) {
    res.status(400).json({ error: checked.error });
    return;
  }
  if (Object.keys(checked.fields).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const doc = await findOwnActivity(req.params.id, res.locals.userId);
  if (doc == null) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  await doc.ref.update(checked.fields);
  res.status(200).json({ activity: activityToJson(await doc.ref.get()) });
});

/**
 * DELETE /api/activities/:id
 * Deletes the activity and its laps.
 * 200 with { deleted: id } | 401 | 404
 */
router.delete('/:id', async (req, res) => {
  const doc = await findOwnActivity(req.params.id, res.locals.userId);
  if (doc == null) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  const laps = await doc.ref.collection('laps').get();
  const batch = db.batch();
  for (const lap of laps.docs) batch.delete(lap.ref);
  batch.delete(doc.ref);
  await batch.commit();

  res.status(200).json({ deleted: doc.id });
});

export default router;
