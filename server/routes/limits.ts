import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const limits = {
    maxCostPerRun: 50.0,
    maxTokensPerStage: 100000,
    maxDurationMinutes: 120,
    currentSpend: 12.35,
    projectedSpend: 23.40,
    burnRate: 0.15,
  };
  
  res.json(limits);
});

export default router;
