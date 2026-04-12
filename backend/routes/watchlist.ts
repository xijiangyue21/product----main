import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { watchlistRepository } from '../repositories/watchlist';
import { insertWatchlistGroupSchema, insertWatchlistItemSchema } from '../db/schema';

const router = Router();

// Get all groups for user
router.get('/groups', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const groups = await watchlistRepository.getGroupsByUser(userId);
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch watchlist groups' });
  }
});

// Create group
router.post('/groups', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const validated = insertWatchlistGroupSchema.parse({ ...req.body, userId });
    const group = await watchlistRepository.createGroup(validated);
    res.status(201).json({ success: true, data: group });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create group';
    res.status(400).json({ success: false, message: msg });
  }
});

// Delete group
router.delete('/groups/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const id = req.params.id as string;
    const deleted = await watchlistRepository.deleteGroup(id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Group not found' });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
});

// Get items by group
router.get('/groups/:groupId/items', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const groupId = req.params.groupId as string;
    const items = await watchlistRepository.getItemsByGroup(groupId, userId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
});

// Get all items for user
router.get('/items', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const items = await watchlistRepository.getItemsByUser(userId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
});

// Add item to group
router.post('/items', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const validated = insertWatchlistItemSchema.parse({ ...req.body, userId });
    const item = await watchlistRepository.addItem(validated);
    res.status(201).json({ success: true, data: item });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to add item';
    res.status(400).json({ success: false, message: msg });
  }
});

// Remove item
router.delete('/items/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const id = req.params.id as string;
    const deleted = await watchlistRepository.removeItem(id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

export default router;
