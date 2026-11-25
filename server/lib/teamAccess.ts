import { randomInt } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '../firebase.ts';
import { isDocId } from './docId.ts';

export interface UserJson {
  id: string;
  email: string;
  name: string;
  isCoach: boolean;
  teamId: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  coachId: string;
  joinCode: string;
  createdAt: string | null;
}

/**
 * The public fields of a user document (never the password hash).
 */
export function userToJson(doc: DocumentSnapshot): UserJson {
  return {
    id: doc.id,
    email: doc.get('email') ?? '',
    name: doc.get('name') ?? '',
    isCoach: doc.get('isCoach') === true,
    teamId: doc.get('teamId') ?? null,
  };
}

export function teamToJson(doc: DocumentSnapshot): Team {
  const createdAt = doc.get('createdAt');
  return {
    id: doc.id,
    name: doc.get('name') ?? '',
    description: doc.get('description') ?? '',
    coachId: doc.get('coachId') ?? '',
    joinCode: doc.get('joinCode') ?? '',
    createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
  };
}

/**
 * Loads a user document, or null if there is no such user.
 */
export async function loadUser(userId: string): Promise<DocumentSnapshot | null> {
  if (!isDocId(userId)) return null;
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? doc : null;
}

/** The team loaded by requireTeam. */
export function teamOf(res: Response): Team {
  return res.locals.team as Team;
}

/** True if the logged in user coaches the team loaded by requireTeam. */
export function isTeamCoach(res: Response): boolean {
  return teamOf(res).coachId === res.locals.userId;
}

/**
 * Middleware (after requireAuth) for routes that need the user to be on a team.
 * Puts the team in res.locals.team (read it with teamOf). 404 if the user has no team.
 */
export async function requireTeam(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await loadUser(res.locals.userId);
  const teamId = user?.get('teamId');
  const teamDoc = typeof teamId === 'string' && teamId !== '' ? await db.collection('teams').doc(teamId).get() : null;
  if (teamDoc == null || !teamDoc.exists) {
    res.status(404).json({ error: 'You are not on a team' });
    return;
  }
  res.locals.team = teamToJson(teamDoc);
  next();
}

/**
 * Middleware (after requireTeam) for routes only the team's coach may use. 403 otherwise.
 */
export function requireCoach(_req: Request, res: Response, next: NextFunction): void {
  if (!isTeamCoach(res)) {
    res.status(403).json({ error: "Only the team's coach can do that" });
    return;
  }
  next();
}

/**
 * Loads an athlete (non-coach member) of the team, or null if the user isn't one.
 * Users outside the team are treated as missing so their ids can't be probed.
 */
export async function findTeamAthlete(team: Team, athleteId: string): Promise<DocumentSnapshot | null> {
  const user = await loadUser(athleteId);
  if (user == null || user.get('teamId') !== team.id || user.id === team.coachId) return null;
  return user;
}

/**
 * Every user on the team (coach included).
 */
export async function loadTeamMembers(teamId: string): Promise<DocumentSnapshot[]> {
  const snapshot = await db.collection('users').where('teamId', '==', teamId).get();
  return snapshot.docs;
}

// No 0/O or 1/I/L so codes are easy to read out loud
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const JOIN_CODE_LENGTH = 6;

/**
 * Makes a join code that no other team is using.
 */
export async function createJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
      code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
    }
    const taken = await db.collection('teams').where('joinCode', '==', code).limit(1).get();
    if (taken.empty) return code;
  }
  throw new Error('Could not generate a unique join code');
}
