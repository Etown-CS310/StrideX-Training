import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (JWT_SECRET === '') {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const TOKEN_LIFETIME = '7d';

/**
 * Makes a signed login token that holds the user's id.
 */
export function createToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
}

/**
 * Express middleware for routes that need a logged in user.
 * Reads "Authorization: Bearer <token>", and on success puts the user id in res.locals.userId.
 * Responds 401 if the token is missing, expired, or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Login required' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice('Bearer '.length), JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Bad token payload');
    }
    res.locals.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid, please log in again' });
  }
}
