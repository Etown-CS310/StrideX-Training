import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { FieldValue } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';

import { db } from '../firebase.ts';
import { createToken } from '../auth.ts';

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // visible in the browser (not secret)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

/**
 * POST /api/register
 * Body: { email, password, name? }
 * 201 with { token, user } | 400 invalid input | 409 email already registered
 */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    res.status(400).json({ error: 'Email address is not valid' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters' });
    return;
  }
  if (name != null && typeof name !== 'string') {
    res.status(400).json({ error: 'Name must be text' });
    return;
  }

  const existing = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
  if (!existing.empty) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }

  // Only the bcrypt hash is stored, never the password itself
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const displayName = (name ?? '').trim() || cleanEmail.split('@')[0];

  const userRef = await db.collection('users').add({
    email: cleanEmail,
    name: displayName,
    passwordHash: passwordHash,
    isCoach: false,
    teamId: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  res.status(201).json({
    token: createToken(userRef.id),
    user: { id: userRef.id, email: cleanEmail, name: displayName },
  });
});

/**
 * POST /api/login
 * Body: { email, password }
 * 200 with { token, user } | 400 missing fields | 401 wrong email or password
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password === '') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const snapshot = await db.collection('users').where('email', '==', email.trim().toLowerCase()).limit(1).get();
  const userDoc = snapshot.docs[0];

  // Same message for unknown email and wrong password, so emails can't be probed
  const passwordOk = userDoc != null && (await bcrypt.compare(password, userDoc.get('passwordHash') ?? ''));
  if (!passwordOk) {
    res.status(401).json({ error: 'Incorrect email or password' });
    return;
  }

  res.status(200).json({
    token: createToken(userDoc.id),
    user: { id: userDoc.id, email: userDoc.get('email'), name: userDoc.get('name') },
  });
});

/**
 * POST /api/google
 * Body: { credential } (the ID token Google gives the browser)
 * 200 with { token, user } | 400 missing credential | 401 token rejected by Google
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};

  if (typeof credential !== 'string' || credential === '') {
    res.status(400).json({ error: 'Google credential is required' });
    return;
  }

  // Google's library checks the signature, expiry, and that the token was made for OUR client id
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ error: 'Google sign-in failed' });
    return;
  }

  if (payload == null || typeof payload.email !== 'string' || !payload.email_verified) {
    res.status(401).json({ error: 'Google account email is not verified' });
    return;
  }

  const cleanEmail = payload.email.trim().toLowerCase();
  const snapshot = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();

  // Existing account (password or Google) -> log in. Otherwise create one with no password.
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    res.status(200).json({
      token: createToken(userDoc.id),
      user: { id: userDoc.id, email: userDoc.get('email'), name: userDoc.get('name') },
    });
    return;
  }

  const displayName = payload.name?.trim() || cleanEmail.split('@')[0];
  const userRef = await db.collection('users').add({
    email: cleanEmail,
    name: displayName,
    passwordHash: null,
    isCoach: false,
    teamId: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  res.status(201).json({
    token: createToken(userRef.id),
    user: { id: userRef.id, email: cleanEmail, name: displayName },
  });
});

export default router;
