import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { feedbackRepository } from '../repositories/feedback';
import { insertFeedbackSchema } from '../db/schema';

const router = Router();

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const validated = insertFeedbackSchema.parse({ ...req.body, userId });
    const feedback = await feedbackRepository.create(validated);
    res.status(201).json({ success: true, data: feedback });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to submit feedback';
    res.status(400).json({ success: false, message: msg });
  }
});

export default router;
