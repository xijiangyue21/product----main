import { db } from '../db';
import {
  alerts, alertHistory,
  InsertAlert, InsertAlertHistory,
  insertAlertSchema, updateAlertSchema, insertAlertHistorySchema,
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

type CreateAlertInput = z.infer<typeof insertAlertSchema>;
type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
type CreateHistoryInput = z.infer<typeof insertAlertHistorySchema>;

export class AlertRepository {
  async getByUser(userId: string) {
    return db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt));
  }

  async create(data: CreateAlertInput) {
    const [alert] = await db.insert(alerts).values(data as InsertAlert).returning();
    return alert;
  }

  async update(id: string, userId: string, data: UpdateAlertInput) {
    const [alert] = await db.update(alerts)
      .set({ ...data as Partial<InsertAlert>, updatedAt: new Date() })
      .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
      .returning();
    return alert;
  }

  async delete(id: string, userId: string) {
    const result = await db.delete(alerts)
      .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getHistory(userId: string) {
    return db.select().from(alertHistory)
      .where(eq(alertHistory.userId, userId))
      .orderBy(desc(alertHistory.triggeredAt))
      .limit(50);
  }

  async addHistory(data: CreateHistoryInput) {
    const [history] = await db.insert(alertHistory).values(data as InsertAlertHistory).returning();
    return history;
  }
}

export const alertRepository = new AlertRepository();
