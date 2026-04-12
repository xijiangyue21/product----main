import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { portfolioRepository } from '../repositories/portfolio';
import { insertPortfolioHoldingSchema, updatePortfolioHoldingSchema } from '../db/schema';

const router = Router();

// Get all holdings
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const holdings = await portfolioRepository.getByUser(userId);
    res.json({ success: true, data: holdings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch holdings' });
  }
});

// Create holding
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const validated = insertPortfolioHoldingSchema.parse({ ...req.body, userId });
    const holding = await portfolioRepository.create(validated);
    res.status(201).json({ success: true, data: holding });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create holding';
    res.status(400).json({ success: false, message: msg });
  }
});

// Update holding
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const id = req.params.id as string;
    const validated = updatePortfolioHoldingSchema.parse(req.body);
    const holding = await portfolioRepository.update(id, userId, validated);
    if (!holding) return res.status(404).json({ success: false, message: 'Holding not found' });
    res.json({ success: true, data: holding });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update holding';
    res.status(400).json({ success: false, message: msg });
  }
});

// Delete holding
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const id = req.params.id as string;
    const deleted = await portfolioRepository.delete(id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Holding not found' });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete holding' });
  }
});

export default router;
