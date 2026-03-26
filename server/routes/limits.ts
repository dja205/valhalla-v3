import { Router } from 'express';
import { readLimitsSnapshot } from '../lib/fsReader';

const router = Router();

// GET /api/limits - Get current limits snapshot
router.get('/', async (_req, res) => {
  try {
    const limits = await readLimitsSnapshot();
    res.json(limits);
  } catch (error) {
    console.error('Error reading limits:', error);
    res.status(500).json({ error: 'Failed to read limits' });
  }
});

export default router;
