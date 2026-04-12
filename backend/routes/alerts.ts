import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { alertRepository } from '../repositories/alerts';
import { insertAlertSchema, updateAlertSchema } from '../db/schema';

const router = Router();

// Get all alerts
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const alertList = await alertRepository.getByUser(userId);
    res.json({ success: true, data: alertList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

// Create alert
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const validated = insertAlertSchema.parse({ ...req.body, userId });
    const alert = await alertRepository.create(validated);
    res.status(201).json({ success: true, data: alert });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create alert';
    res.status(400).json({ success: false, message: msg });
  }
});

// Update alert (status, conditions)
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const id = req.params.id as string;
    const validated = updateAlertSchema.parse(req.body);
    const alert = await alertRepository.update(id, userId, validated);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update alert';
    res.status(400).json({ success: false, message: msg });
  }
});

// Delete alert
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const id = req.params.id as string;
    const deleted = await alertRepository.delete(id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete alert' });
  }
});

// Get alert history
router.get('/history', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const history = await alertRepository.getHistory(userId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch alert history' });
  }
});

export default router;
