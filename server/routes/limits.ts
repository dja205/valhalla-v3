import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { LimitsSnapshot } from '../../src/types/api';

const router = Router();

const LIMITS_FILE = process.env.LIMITS_FILE || 
  path.join(process.env.HOME || '~', '.openclaw/workspace/odinclaw/data/limits-snapshot.json');

// GET /api/limits - Get current limits snapshot
router.get('/', async (req, res) => {
  try {
    // Try to read from local file first
    try {
      const content = await fs.readFile(LIMITS_FILE, 'utf-8');
      const limits = JSON.parse(content) as LimitsSnapshot;
      return res.json(limits);
    } catch {
      // File doesn't exist or is invalid, return defaults
    }
    
    // Return sensible defaults
    const limits: LimitsSnapshot = {
      claude: { used: 0, limit: 1000, resetAt: null },
      copilot: { used: 0, limit: 300, resetAt: null },
      lastUpdated: new Date().toISOString(),
    };
    
    res.json(limits);
  } catch (error) {
    console.error('Error reading limits:', error);
    res.status(500).json({ error: 'Failed to read limits' });
  }
});

export default router;
