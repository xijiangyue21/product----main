import { pgTable, text, timestamp, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  theme: text('theme').notNull().default('dark'),
  refreshRate: integer('refresh_rate').notNull().default(3),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateUserSchema = insertUserSchema.partial();

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
});

export const signupUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================
// Watchlist Groups Table
// ============================================
export const watchlistGroups = pgTable('WatchlistGroups', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertWatchlistGroupSchema = createInsertSchema(watchlistGroups, {
  name: z.string().min(1, 'Group name is required'),
});
export type WatchlistGroup = typeof watchlistGroups.$inferSelect;
export type InsertWatchlistGroup = typeof watchlistGroups.$inferInsert;

// ============================================
// Watchlist Items Table
// ============================================
export const watchlistItems = pgTable('WatchlistItems', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  groupId: text('group_id').notNull().references(() => watchlistGroups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems, {
  symbol: z.string().min(1, 'Symbol is required'),
  name: z.string().min(1, 'Name is required'),
});
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type InsertWatchlistItem = typeof watchlistItems.$inferInsert;

// ============================================
// Portfolio Holdings Table
// ============================================
export const portfolioHoldings = pgTable('PortfolioHoldings', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  shares: decimal('shares', { precision: 18, scale: 4 }).notNull(),
  costPrice: decimal('cost_price', { precision: 18, scale: 4 }).notNull(),
  currentPrice: decimal('current_price', { precision: 18, scale: 4 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings, {
  symbol: z.string().min(1, 'Symbol is required'),
  name: z.string().min(1, 'Name is required'),
  shares: z.coerce.string(),
  costPrice: z.coerce.string(),
  currentPrice: z.coerce.string().optional(),
});
export const updatePortfolioHoldingSchema = insertPortfolioHoldingSchema.partial();
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertPortfolioHolding = typeof portfolioHoldings.$inferInsert;

// ============================================
// Alerts Table
// ============================================
export const alerts = pgTable('Alerts', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  stockName: text('stock_name').notNull(),
  conditionType: text('condition_type').notNull(), // 'price_above' | 'price_below' | 'change_above' | 'change_below'
  conditionValue: decimal('condition_value', { precision: 18, scale: 4 }).notNull(),
  notifyApp: boolean('notify_app').notNull().default(true),
  notifySms: boolean('notify_sms').notNull().default(false),
  notifyWechat: boolean('notify_wechat').notNull().default(false),
  status: text('status').notNull().default('active'), // 'active' | 'paused' | 'triggered'
  triggerCount: integer('trigger_count').notNull().default(0),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts, {
  symbol: z.string().min(1, 'Symbol is required'),
  stockName: z.string().min(1, 'Stock name is required'),
  conditionType: z.enum(['price_above', 'price_below', 'change_above', 'change_below']),
  conditionValue: z.coerce.string(),
  notifyApp: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyWechat: z.boolean().optional(),
  status: z.enum(['active', 'paused', 'triggered']).optional(),
});
export const updateAlertSchema = insertAlertSchema.partial();
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ============================================
// Alert History Table
// ============================================
export const alertHistory = pgTable('AlertHistory', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  alertId: text('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  stockName: text('stock_name').notNull(),
  triggerPrice: decimal('trigger_price', { precision: 18, scale: 4 }).notNull(),
  conditionType: text('condition_type').notNull(),
  conditionValue: decimal('condition_value', { precision: 18, scale: 4 }).notNull(),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
});

export const insertAlertHistorySchema = createInsertSchema(alertHistory, {
  triggerPrice: z.coerce.string(),
  conditionValue: z.coerce.string(),
});
export type AlertHistoryItem = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

// ============================================
// News / Feedback Table
// ============================================
export const feedbacks = pgTable('Feedbacks', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks, {
  content: z.string().min(1, 'Feedback content is required'),
});
export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

// ============================================
// Uploads Table
// ============================================
export const uploads = pgTable('Uploads', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  s3Url: z.string().url('Invalid S3 URL'),
  uploadId: z.string().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
});

export const updateUploadSchema = insertUploadSchema.partial();
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;
