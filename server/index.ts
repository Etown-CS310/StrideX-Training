import express, { type NextFunction, type Request, type Response } from 'express';

// Load secrets from .env before anything reads process.env
try {
  process.loadEnvFile();
} catch {
  // No .env file, auth.ts reports what's missing
}

const { default: userRoutes } = await import('./routes/users.ts');
const { default: activityRoutes } = await import('./routes/activities.ts');

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: '2mb' }));

app.use('/api', userRoutes);
app.use('/api/activities', activityRoutes);

// Unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Bad JSON bodies and anything thrown inside a route (Express 5 forwards async errors here)
app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body is not valid JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Express 5 passes startup errors (like the port being taken) to this callback
app.listen(PORT, (err?: Error & { code?: string }) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error('Port ' + PORT + ' is already in use. Stop the other server (or change PORT in .env) and try again.');
    } else {
      console.error('Could not start the API server:', err);
    }
    process.exit(1);
  }
  console.log('StrideX API listening on http://localhost:' + PORT);
});
