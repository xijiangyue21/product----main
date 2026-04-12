import { db } from '../db';
import {
  portfolioHoldings,
  InsertPortfolioHolding,
  insertPortfolioHoldingSchema,
  updatePortfolioHoldingSchema,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateHoldingInput = z.infer<typeof insertPortfolioHoldingSchema>;
type UpdateHoldingInput = z.infer<typeof updatePortfolioHoldingSchema>;

export class PortfolioRepository {
  async getByUser(userId: string) {
    return db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId));
  }

  async create(data: CreateHoldingInput) {
    const [holding] = await db.insert(portfolioHoldings).values(data as InsertPortfolioHolding).returning();
    return holding;
  }

  async update(id: string, userId: string, data: UpdateHoldingInput) {
    const [holding] = await db.update(portfolioHoldings)
      .set({ ...data as Partial<InsertPortfolioHolding>, updatedAt: new Date() })
      .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, userId)))
      .returning();
    return holding;
  }

  async delete(id: string, userId: string) {
    const result = await db.delete(portfolioHoldings)
      .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const portfolioRepository = new PortfolioRepository();
