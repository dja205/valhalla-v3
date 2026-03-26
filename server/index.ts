import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import configRouter from './routes/config';
import limitsRouter from './routes/limits';
import agentsRouter from './routes/agents';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 3001;

// Restrict CORS to localhost only
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard endpoint (returns all data in one call)
app.get('/api/dashboard', async (req, res, next) => {
  // Forward to the dashboard handler in projects router
  req.url = '/dashboard';
  projectsRouter(req, res, next);
});

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/config', configRouter);
app.use('/api/limits', limitsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/analytics', analyticsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Valhalla V3 server running on http://localhost:${PORT}`);
});
