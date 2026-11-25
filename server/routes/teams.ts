import { Router, type Response } from 'express';
import { FieldValue, Timestamp, type DocumentSnapshot, type Transaction } from 'firebase-admin/firestore';

import { db } from '../firebase.ts';
import { requireAuth } from '../auth.ts';
import { activityToJson, findUserActivity, loadLaps, loadUserActivities, type ActivityJson } from '../lib/activityData.ts';
import {
  createJoinCode, findTeamAthlete, isTeamCoach, loadTeamMembers, requireCoach, requireTeam, teamOf, teamToJson,
  type Team,
} from '../lib/teamAccess.ts';
import {
  activitiesInRange, GOAL_METRICS, goalValue, parsePeriodQuery, periodRange, PERIODS, summarize,
  type Goal, type GoalMetric, type Period,
} from '../lib/summary.ts';
import { isDocId } from '../lib/docId.ts';
import { joinLimiter } from '../lib/rateLimits.ts';

const router = Router();

// Every team route needs a logged in user
router.use(requireAuth);

const MAX_TEAM_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_GOAL_TITLE_LENGTH = 200;
const GOAL_APPLIES_TO = ['team', 'each'];

type Fields = Record<string, unknown>;

/**
 * Checks team name/description. With partial = true (PATCH) only the fields sent are checked.
 */
function validateTeam(body: Fields, partial: boolean): { fields: Fields } | { error: string } {
  const fields: Fields = {};

  if ('name' in body || !partial) {
    if (typeof body.name !== 'string' || body.name.trim() === '') return { error: 'name is required' };
    if (body.name.trim().length > MAX_TEAM_NAME_LENGTH) return { error: 'name is too long' };
    fields.name = body.name.trim();
  }

  if ('description' in body) {
    if (typeof body.description !== 'string') return { error: 'description must be text' };
    if (body.description.trim().length > MAX_DESCRIPTION_LENGTH) return { error: 'description is too long' };
    fields.description = body.description.trim();
  } else if (!partial) {
    fields.description = '';
  }

  return { fields: fields };
}

/**
 * Checks the fields of a goal. With partial = true (PATCH) only the fields sent are checked.
 */
function validateGoal(body: Fields, partial: boolean): { fields: Fields } | { error: string } {
  const fields: Fields = {};
  const has = (key: string) => key in body;

  if (has('title') || !partial) {
    if (typeof body.title !== 'string' || body.title.trim() === '') return { error: 'title is required' };
    if (body.title.trim().length > MAX_GOAL_TITLE_LENGTH) return { error: 'title is too long' };
    fields.title = body.title.trim();
  }

  if (has('metric') || !partial) {
    if (typeof body.metric !== 'string' || !(GOAL_METRICS as readonly string[]).includes(body.metric)) {
      return { error: 'metric must be one of ' + GOAL_METRICS.join(', ') };
    }
    fields.metric = body.metric;
  }

  if (has('target') || !partial) {
    if (typeof body.target !== 'number' || !isFinite(body.target) || body.target <= 0) {
      return { error: 'target must be a positive number' };
    }
    fields.target = body.target;
  }

  if (has('period') || !partial) {
    if (typeof body.period !== 'string' || !(PERIODS as readonly string[]).includes(body.period)) {
      return { error: 'period must be week or month' };
    }
    fields.period = body.period;
  }

  if (has('activityType')) {
    if (body.activityType === null) {
      fields.activityType = null;
    } else if (typeof body.activityType === 'string' && body.activityType.trim() !== '') {
      fields.activityType = body.activityType.trim().toLowerCase();
    } else {
      return { error: 'activityType must be text or null' };
    }
  } else if (!partial) {
    fields.activityType = null;
  }

  if (has('appliesTo')) {
    if (typeof body.appliesTo !== 'string' || !GOAL_APPLIES_TO.includes(body.appliesTo)) {
      return { error: 'appliesTo must be team or each' };
    }
    fields.appliesTo = body.appliesTo;
  } else if (!partial) {
    fields.appliesTo = 'team';
  }

  return { fields: fields };
}

type GoalJson = Goal & { createdBy: string | null; createdAt: string | null };

function goalToJson(doc: DocumentSnapshot): GoalJson {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: data.title,
    metric: data.metric as GoalMetric,
    target: data.target,
    period: data.period as Period,
    activityType: data.activityType ?? null,
    appliesTo: data.appliesTo === 'each' ? 'each' : 'team',
    createdBy: data.createdBy ?? null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
  };
}

async function loadGoals(teamId: string): Promise<GoalJson[]> {
  const snapshot = await db.collection('teams').doc(teamId).collection('goals').get();
  const goals = snapshot.docs.map(goalToJson);
  goals.sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
  return goals;
}

function byName(a: DocumentSnapshot, b: DocumentSnapshot): number {
  return String(a.get('name') ?? '').localeCompare(String(b.get('name') ?? ''));
}

/**
 * The team's athletes (members other than the coach), sorted by name.
 */
async function loadAthletes(team: Team): Promise<DocumentSnapshot[]> {
  const members = await loadTeamMembers(team.id);
  return members.filter((member) => member.id !== team.coachId).sort(byName);
}

/** Team as the viewer may see it: only the coach gets the join code. */
function teamForViewer(team: Team, viewerIsCoach: boolean): Fields {
  if (viewerIsCoach) return { ...team };
  const { joinCode: _joinCode, ...rest } = team;
  return rest;
}

/** A member as the viewer may see them: only the coach gets emails. */
function memberForViewer(member: DocumentSnapshot, viewerIsCoach: boolean): Fields {
  const json: Fields = { id: member.id, name: member.get('name') ?? '' };
  if (viewerIsCoach) json.email = member.get('email') ?? '';
  return json;
}

/**
 * True if the user's teamId points at a team that still exists (read inside the transaction).
 * A teamId left behind by a deleted team doesn't count, so the user can still create or join one.
 */
async function isOnTeam(tx: Transaction, user: DocumentSnapshot): Promise<boolean> {
  const teamId = user.get('teamId');
  if (!isDocId(teamId)) return false;
  return (await tx.get(db.collection('teams').doc(teamId))).exists;
}

/**
 * The goal named in the URL, or null (after sending a 404) if the id isn't valid or the goal doesn't exist.
 */
async function goalFromParams(res: Response, goalId: string): Promise<DocumentSnapshot | null> {
  const goal = isDocId(goalId)
    ? await db.collection('teams').doc(teamOf(res).id).collection('goals').doc(goalId).get()
    : null;
  if (goal == null || !goal.exists) {
    res.status(404).json({ error: 'Goal not found' });
    return null;
  }
  return goal;
}

/**
 * Loads the athlete named in the URL, or sends a 404 and returns null if they aren't on the coach's team.
 */
async function athleteFromParams(res: Response, athleteId: string): Promise<DocumentSnapshot | null> {
  const athlete = await findTeamAthlete(teamOf(res), athleteId);
  if (athlete == null) res.status(404).json({ error: 'Athlete not found on your team' });
  return athlete;
}

// ---------------------------------------------------------------------------
// Team membership
// ---------------------------------------------------------------------------

/**
 * POST /api/team
 * Body: { name, description? }. The caller becomes the team's coach.
 * 201 with { team } | 400 | 401 | 409 already on a team
 */
router.post('/', async (req, res) => {
  const checked = validateTeam(req.body ?? {}, false);
  if ('error' in checked) {
    res.status(400).json({ error: checked.error });
    return;
  }

  const joinCode = await createJoinCode();
  const userRef = db.collection('users').doc(res.locals.userId);
  const teamRef = db.collection('teams').doc();

  // In a transaction so two requests can't put the same user on two teams
  const outcome = await db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    if (!user.exists) return 'no-user';
    if (await isOnTeam(tx, user)) return 'on-team';
    tx.set(teamRef, {
      ...checked.fields,
      coachId: userRef.id,
      joinCode: joinCode,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(userRef, { teamId: teamRef.id, isCoach: true });
    return 'ok';
  });

  if (outcome === 'no-user') {
    res.status(401).json({ error: 'Account not found, please log in again' });
    return;
  }
  if (outcome === 'on-team') {
    res.status(409).json({ error: 'You are already on a team. Leave it before creating a new one' });
    return;
  }
  res.status(201).json({ team: teamToJson(await teamRef.get()) });
});

/**
 * GET /api/team
 * 200 with { team, coach, athletes, viewerIsCoach } | 401 | 404 not on a team
 */
router.get('/', requireTeam, async (_req, res) => {
  const team = teamOf(res);
  const viewerIsCoach = isTeamCoach(res);
  const members = await loadTeamMembers(team.id);
  const coach = members.find((member) => member.id === team.coachId);
  const athletes = members.filter((member) => member.id !== team.coachId).sort(byName);

  res.status(200).json({
    team: teamForViewer(team, viewerIsCoach),
    coach: coach == null ? null : memberForViewer(coach, viewerIsCoach),
    athletes: athletes.map((athlete) => memberForViewer(athlete, viewerIsCoach)),
    viewerIsCoach: viewerIsCoach,
  });
});

/**
 * PATCH /api/team (coach)
 * Body: { name?, description? }
 * 200 with { team } | 400 | 401 | 403 | 404
 */
router.patch('/', requireTeam, requireCoach, async (req, res) => {
  const checked = validateTeam(req.body ?? {}, true);
  if ('error' in checked) {
    res.status(400).json({ error: checked.error });
    return;
  }
  if (Object.keys(checked.fields).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  const teamRef = db.collection('teams').doc(teamOf(res).id);
  await teamRef.update(checked.fields);
  res.status(200).json({ team: teamToJson(await teamRef.get()) });
});

/**
 * DELETE /api/team (coach)
 * Takes every member off the team, then deletes its goals and the team.
 * 200 with { deleted: id } | 401 | 403 | 404
 */
router.delete('/', requireTeam, requireCoach, async (_req, res) => {
  const team = teamOf(res);
  const teamRef = db.collection('teams').doc(team.id);

  // In a transaction so someone joining at the same moment can't be left pointing at the deleted team
  // (the join transaction reads the team doc, so it retries and finds the team gone)
  await db.runTransaction(async (tx) => {
    const [members, goals] = await Promise.all([
      tx.get(db.collection('users').where('teamId', '==', team.id)),
      tx.get(teamRef.collection('goals')),
    ]);
    for (const member of members.docs) tx.update(member.ref, { teamId: null });
    for (const goal of goals.docs) tx.delete(goal.ref);
    tx.delete(teamRef);
  });

  res.status(200).json({ deleted: team.id });
});

/**
 * POST /api/team/join-code (coach)
 * Makes a new join code; the old one stops working.
 * 200 with { joinCode } | 401 | 403 | 404
 */
router.post('/join-code', requireTeam, requireCoach, async (_req, res) => {
  const joinCode = await createJoinCode();
  await db.collection('teams').doc(teamOf(res).id).update({ joinCode: joinCode });
  res.status(200).json({ joinCode: joinCode });
});

/**
 * POST /api/team/join
 * Body: { code } (not case sensitive)
 * 200 with { team } | 400 | 401 | 404 unknown code | 409 already on a team
 */
router.post('/join', joinLimiter, async (req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== 'string' || code.trim() === '') {
    res.status(400).json({ error: 'Join code is required' });
    return;
  }
  const cleanCode = code.trim().toUpperCase();

  const found = await db.collection('teams').where('joinCode', '==', cleanCode).limit(1).get();
  if (found.empty) {
    res.status(404).json({ error: 'No team has that join code' });
    return;
  }
  const teamRef = found.docs[0].ref;
  const userRef = db.collection('users').doc(res.locals.userId);

  const outcome = await db.runTransaction(async (tx) => {
    const [user, team] = await Promise.all([tx.get(userRef), tx.get(teamRef)]);
    if (!user.exists) return 'no-user';
    if (await isOnTeam(tx, user)) return 'on-team';
    // The code could have been changed or the team deleted since the lookup
    if (!team.exists || team.get('joinCode') !== cleanCode) return 'no-team';
    tx.update(userRef, { teamId: teamRef.id });
    return 'ok';
  });

  if (outcome === 'no-user') {
    res.status(401).json({ error: 'Account not found, please log in again' });
    return;
  }
  if (outcome === 'on-team') {
    res.status(409).json({ error: 'You are already on a team. Leave it before joining another' });
    return;
  }
  if (outcome === 'no-team') {
    res.status(404).json({ error: 'No team has that join code' });
    return;
  }
  res.status(200).json({ team: teamForViewer(teamToJson(await teamRef.get()), false) });
});

/**
 * POST /api/team/leave (athlete)
 * 200 with { left: teamId } | 401 | 404 | 409 the coach must transfer or delete the team instead
 */
router.post('/leave', requireTeam, async (_req, res) => {
  const team = teamOf(res);
  if (isTeamCoach(res)) {
    res.status(409).json({ error: 'Coaches cannot leave their team. Transfer coaching or delete the team first' });
    return;
  }
  await db.collection('users').doc(res.locals.userId).update({ teamId: null });
  res.status(200).json({ left: team.id });
});

/**
 * DELETE /api/team/members/:userId (coach)
 * 200 with { removed: userId } | 401 | 403 | 404
 */
router.delete('/members/:userId', requireTeam, requireCoach, async (req, res) => {
  const athlete = await athleteFromParams(res, String(req.params.userId));
  if (athlete == null) return;
  await athlete.ref.update({ teamId: null });
  res.status(200).json({ removed: athlete.id });
});

/**
 * POST /api/team/transfer (coach)
 * Body: { userId } of an athlete on the team. They become the coach and the old coach stays on as an athlete.
 * 200 with { team } | 400 | 401 | 403 | 404
 */
router.post('/transfer', requireTeam, requireCoach, async (req, res) => {
  const { userId } = req.body ?? {};
  if (typeof userId !== 'string' || userId === '') {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  if (!isDocId(userId)) {
    res.status(404).json({ error: 'Athlete not found on your team' });
    return;
  }

  const teamRef = db.collection('teams').doc(teamOf(res).id);
  const oldCoachRef = db.collection('users').doc(res.locals.userId);
  const newCoachRef = db.collection('users').doc(userId);

  const outcome = await db.runTransaction(async (tx) => {
    const [team, newCoach] = await Promise.all([tx.get(teamRef), tx.get(newCoachRef)]);
    if (!team.exists || team.get('coachId') !== oldCoachRef.id) return 'not-coach';
    if (!newCoach.exists || newCoach.get('teamId') !== teamRef.id || newCoach.id === oldCoachRef.id) return 'no-athlete';
    tx.update(teamRef, { coachId: newCoachRef.id });
    tx.update(newCoachRef, { isCoach: true });
    tx.update(oldCoachRef, { isCoach: false });
    return 'ok';
  });

  if (outcome === 'not-coach') {
    res.status(403).json({ error: "Only the team's coach can do that" });
    return;
  }
  if (outcome === 'no-athlete') {
    res.status(404).json({ error: 'Athlete not found on your team' });
    return;
  }
  // The old coach is an athlete now, so the join code is left out
  res.status(200).json({ team: teamForViewer(teamToJson(await teamRef.get()), false) });
});

// ---------------------------------------------------------------------------
// Coach view of athletes' training data (read-only)
// ---------------------------------------------------------------------------

/**
 * GET /api/team/athletes/:athleteId/activities (coach)
 * Optional ?from=ISO&to=ISO (to is exclusive). Same activity shape as GET /api/activities.
 * 200 with { athlete, activities } | 400 | 401 | 403 | 404
 */
router.get('/athletes/:athleteId/activities', requireTeam, requireCoach, async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  if (from != null && (typeof from !== 'string' || isNaN(Date.parse(from)))) {
    res.status(400).json({ error: 'from must be an ISO date' });
    return;
  }
  if (to != null && (typeof to !== 'string' || isNaN(Date.parse(to)))) {
    res.status(400).json({ error: 'to must be an ISO date' });
    return;
  }

  const athlete = await athleteFromParams(res, String(req.params.athleteId));
  if (athlete == null) return;

  let activities: ActivityJson[] = await loadUserActivities(athlete.id);
  if (from != null || to != null) {
    activities = activitiesInRange(activities, from ?? null, to ?? null);
  }
  res.status(200).json({ athlete: memberForViewer(athlete, true), activities: activities });
});

/**
 * GET /api/team/athletes/:athleteId/activities/:activityId (coach)
 * 200 with { activity, laps } | 401 | 403 | 404
 */
router.get('/athletes/:athleteId/activities/:activityId', requireTeam, requireCoach, async (req, res) => {
  const athlete = await athleteFromParams(res, String(req.params.athleteId));
  if (athlete == null) return;

  const doc = await findUserActivity(String(req.params.activityId), athlete.id);
  if (doc == null) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }
  res.status(200).json({ activity: activityToJson(doc), laps: await loadLaps(doc) });
});

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

/**
 * GET /api/team/athletes/:athleteId/summary (coach)
 * Query: period=week|month (default week), date=YYYY-MM-DD (default today), tzOffset=minutes (default 0)
 * 200 with { period, athlete, totals, goals } | 400 | 401 | 403 | 404
 */
router.get('/athletes/:athleteId/summary', requireTeam, requireCoach, async (req, res) => {
  const query = parsePeriodQuery(req.query as Fields);
  if ('error' in query) {
    res.status(400).json({ error: query.error });
    return;
  }

  const athlete = await athleteFromParams(res, String(req.params.athleteId));
  if (athlete == null) return;

  const [activities, goals] = await Promise.all([loadUserActivities(athlete.id), loadGoals(teamOf(res).id)]);
  const range = periodRange(query.period, query.date, query.tzOffset);

  res.status(200).json({
    period: range,
    athlete: memberForViewer(athlete, true),
    totals: summarize(activitiesInRange(activities, range.start, range.end)),
    // Each goal is measured over its own period (the week or month containing `date`)
    goals: goals.map((goal) => {
      const goalRange = periodRange(goal.period, query.date, query.tzOffset);
      const current = goalValue(goal, activitiesInRange(activities, goalRange.start, goalRange.end));
      return {
        goal: goal,
        period: goalRange,
        current: current,
        // One athlete can't meet a team-total goal alone, so only "each" goals get a verdict here
        met: goal.appliesTo === 'each' ? current >= goal.target : null,
      };
    }),
  });
});

/**
 * GET /api/team/summary (coach)
 * Same query as the athlete summary.
 * 200 with { period, team, athletes, goals } | 400 | 401 | 403 | 404
 */
router.get('/summary', requireTeam, requireCoach, async (req, res) => {
  const query = parsePeriodQuery(req.query as Fields);
  if ('error' in query) {
    res.status(400).json({ error: query.error });
    return;
  }

  const team = teamOf(res);
  const [athletes, goals] = await Promise.all([loadAthletes(team), loadGoals(team.id)]);
  const activityLists = await Promise.all(athletes.map((athlete) => loadUserActivities(athlete.id)));
  const range = periodRange(query.period, query.date, query.tzOffset);
  const inPeriod = activityLists.map((list) => activitiesInRange(list, range.start, range.end));

  res.status(200).json({
    period: range,
    team: summarize(inPeriod.flat()),
    athletes: athletes.map((athlete, i) => ({
      ...memberForViewer(athlete, true),
      totals: summarize(inPeriod[i]),
    })),
    // Each goal is measured over its own period (the week or month containing `date`)
    goals: goals.map((goal) => {
      const goalRange = periodRange(goal.period, query.date, query.tzOffset);
      const perAthlete = athletes.map((athlete, i) => {
        const current = goalValue(goal, activitiesInRange(activityLists[i], goalRange.start, goalRange.end));
        return {
          id: athlete.id,
          name: athlete.get('name') ?? '',
          current: current,
          met: goal.appliesTo === 'each' ? current >= goal.target : null,
        };
      });
      const current = perAthlete.reduce((sum, athlete) => sum + athlete.current, 0);
      const athletesMet = perAthlete.filter((athlete) => athlete.met === true).length;
      return {
        goal: goal,
        period: goalRange,
        current: current,
        met: goal.appliesTo === 'team'
          ? current >= goal.target
          : perAthlete.length > 0 && athletesMet === perAthlete.length,
        athletesMet: goal.appliesTo === 'each' ? athletesMet : null,
        athletes: perAthlete,
      };
    }),
  });
});

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/**
 * GET /api/team/goals (any member)
 * 200 with { goals } | 401 | 404
 */
router.get('/goals', requireTeam, async (_req, res) => {
  res.status(200).json({ goals: await loadGoals(teamOf(res).id) });
});

/**
 * POST /api/team/goals (coach)
 * Body: { title, metric, target, period, activityType?, appliesTo? }
 * 201 with { goal } | 400 | 401 | 403 | 404
 */
router.post('/goals', requireTeam, requireCoach, async (req, res) => {
  const checked = validateGoal(req.body ?? {}, false);
  if ('error' in checked) {
    res.status(400).json({ error: checked.error });
    return;
  }
  const goalRef = db.collection('teams').doc(teamOf(res).id).collection('goals').doc();
  await goalRef.set({
    ...checked.fields,
    createdBy: res.locals.userId,
    createdAt: FieldValue.serverTimestamp(),
  });
  res.status(201).json({ goal: goalToJson(await goalRef.get()) });
});

/**
 * PATCH /api/team/goals/:goalId (coach)
 * Body: any of the goal fields
 * 200 with { goal } | 400 | 401 | 403 | 404
 */
router.patch('/goals/:goalId', requireTeam, requireCoach, async (req, res) => {
  const checked = validateGoal(req.body ?? {}, true);
  if ('error' in checked) {
    res.status(400).json({ error: checked.error });
    return;
  }
  if (Object.keys(checked.fields).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  const goal = await goalFromParams(res, String(req.params.goalId));
  if (goal == null) return;
  await goal.ref.update(checked.fields);
  res.status(200).json({ goal: goalToJson(await goal.ref.get()) });
});

/**
 * DELETE /api/team/goals/:goalId (coach)
 * 200 with { deleted: id } | 401 | 403 | 404
 */
router.delete('/goals/:goalId', requireTeam, requireCoach, async (req, res) => {
  const goal = await goalFromParams(res, String(req.params.goalId));
  if (goal == null) return;
  await goal.ref.delete();
  res.status(200).json({ deleted: goal.id });
});

export default router;
