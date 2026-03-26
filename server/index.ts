import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import configRouter from './routes/config';
import limitsRouter from './routes/limits';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/config', configRouter);
app.use('/api/limits', limitsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Valhalla V3 server running on http://localhost:${PORT}`);
});
