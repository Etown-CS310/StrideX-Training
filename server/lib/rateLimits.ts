import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Limits per client IP. Responses use the same { error } shape as the rest of the API,
 * and RateLimit headers tell the client when it can try again.
 * Behind a reverse proxy, set app.set('trust proxy', ...) so req.ip is the real client.
 */
function limiter(limit: number, error: string) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: error },
  });
}

/** Login, register and Google sign-in: slows down password guessing and mass sign-ups. */
export const authLimiter = limiter(20, 'Too many sign-in attempts. Please wait a few minutes and try again');

/**
 * Joining a team: slows down guessing join codes. Counted per logged in user (use after requireAuth),
 * so classmates behind the same campus IP don't share one budget.
 */
export const joinLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (_req, res) => String(res.locals.userId),
  message: { error: 'Too many join attempts. Please wait a few minutes and try again' },
});
