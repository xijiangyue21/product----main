-- Migration: Add stock-related tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add theme and refresh_rate to Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "refresh_rate" INTEGER NOT NULL DEFAULT 3;

-- WatchlistGroups
CREATE TABLE IF NOT EXISTS "WatchlistGroups" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- WatchlistItems
CREATE TABLE IF NOT EXISTS "WatchlistItems" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "group_id" TEXT NOT NULL REFERENCES "WatchlistGroups"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- PortfolioHoldings
CREATE TABLE IF NOT EXISTS "PortfolioHoldings" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shares" DECIMAL(18,4) NOT NULL,
    "cost_price" DECIMAL(18,4) NOT NULL,
    "current_price" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Alerts
CREATE TABLE IF NOT EXISTS "Alerts" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "stock_name" TEXT NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_value" DECIMAL(18,4) NOT NULL,
    "notify_app" BOOLEAN NOT NULL DEFAULT TRUE,
    "notify_sms" BOOLEAN NOT NULL DEFAULT FALSE,
    "notify_wechat" BOOLEAN NOT NULL DEFAULT FALSE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "last_triggered_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AlertHistory
CREATE TABLE IF NOT EXISTS "AlertHistory" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "alert_id" TEXT NOT NULL REFERENCES "Alerts"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "stock_name" TEXT NOT NULL,
    "trigger_price" DECIMAL(18,4) NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_value" DECIMAL(18,4) NOT NULL,
    "triggered_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Feedbacks
CREATE TABLE IF NOT EXISTS "Feedbacks" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
