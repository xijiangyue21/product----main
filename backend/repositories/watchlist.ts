import { db } from '../db';
import {
  watchlistGroups, watchlistItems,
  InsertWatchlistGroup, InsertWatchlistItem,
  insertWatchlistGroupSchema, insertWatchlistItemSchema,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateGroupInput = z.infer<typeof insertWatchlistGroupSchema>;
type CreateItemInput = z.infer<typeof insertWatchlistItemSchema>;

export class WatchlistRepository {
  async getGroupsByUser(userId: string) {
    return db.select().from(watchlistGroups).where(eq(watchlistGroups.userId, userId));
  }

  async createGroup(data: CreateGroupInput) {
    const [group] = await db.insert(watchlistGroups).values(data as InsertWatchlistGroup).returning();
    return group;
  }

  async deleteGroup(id: string, userId: string) {
    const result = await db.delete(watchlistGroups)
      .where(and(eq(watchlistGroups.id, id), eq(watchlistGroups.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getItemsByGroup(groupId: string, userId: string) {
    return db.select().from(watchlistItems)
      .where(and(eq(watchlistItems.groupId, groupId), eq(watchlistItems.userId, userId)));
  }

  async getItemsByUser(userId: string) {
    return db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
  }

  async addItem(data: CreateItemInput) {
    const [item] = await db.insert(watchlistItems).values(data as InsertWatchlistItem).returning();
    return item;
  }

  async removeItem(id: string, userId: string) {
    const result = await db.delete(watchlistItems)
      .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const watchlistRepository = new WatchlistRepository();
