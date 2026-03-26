import { Router } from 'express';
import { parseConfig } from '../lib/configParser';

const router = Router();

// GET /api/config - Get agent configuration
router.get('/', async (req, res) => {
  try {
    const config = await parseConfig();
    res.json(config);
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

export default router;
