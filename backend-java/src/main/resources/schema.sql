CREATE TABLE IF NOT EXISTS `Users` (
    `id` varchar(255) PRIMARY KEY,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `theme` varchar(255) NOT NULL,
    `refresh_rate` int NOT NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NOT NULL,
    UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PortfolioHoldings` (
    `id` varchar(255) PRIMARY KEY,
    `user_id` varchar(255) NOT NULL,
    `symbol` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `shares` decimal(18,4) NOT NULL,
    `cost_price` decimal(18,4) NOT NULL,
    `current_price` decimal(18,4) NOT NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NOT NULL,
    INDEX `idx_portfolio_holdings_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WatchlistGroups` (
    `id` varchar(255) PRIMARY KEY,
    `user_id` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NOT NULL,
    INDEX `idx_watchlist_groups_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WatchlistItems` (
    `id` varchar(255) PRIMARY KEY,
    `group_id` varchar(255) NOT NULL,
    `user_id` varchar(255) NOT NULL,
    `symbol` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `created_at` datetime(6) NOT NULL,
    INDEX `idx_watchlist_items_user_created` (`user_id`, `created_at`),
    INDEX `idx_watchlist_items_group_user_created` (`group_id`, `user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Alerts` (
    `id` varchar(255) PRIMARY KEY,
    `user_id` varchar(255) NOT NULL,
    `symbol` varchar(255) NOT NULL,
    `stock_name` varchar(255) NOT NULL,
    `condition_type` varchar(255) NOT NULL,
    `condition_value` decimal(18,4) NOT NULL,
    `notify_app` boolean NOT NULL,
    `notify_sms` boolean NOT NULL,
    `notify_wechat` boolean NOT NULL,
    `status` varchar(255) NOT NULL,
    `trigger_count` int NOT NULL,
    `last_triggered_at` datetime(6) NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NOT NULL,
    INDEX `idx_alerts_user_created` (`user_id`, `created_at`),
    INDEX `idx_alerts_user_status_created` (`user_id`, `status`, `created_at`),
    INDEX `idx_alerts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AlertHistory` (
    `id` varchar(255) PRIMARY KEY,
    `alert_id` varchar(255) NOT NULL,
    `user_id` varchar(255) NOT NULL,
    `symbol` varchar(255) NOT NULL,
    `stock_name` varchar(255) NOT NULL,
    `trigger_price` decimal(18,4) NOT NULL,
    `condition_type` varchar(255) NOT NULL,
    `condition_value` decimal(18,4) NOT NULL,
    `triggered_at` datetime(6) NOT NULL,
    INDEX `idx_alert_history_user_triggered` (`user_id`, `triggered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AiAdviceRecords` (
    `id` varchar(255) PRIMARY KEY,
    `user_id` varchar(255) NOT NULL,
    `code` varchar(255) NOT NULL,
    `symbol` varchar(255) NOT NULL,
    `stock_name` varchar(255) NOT NULL,
    `source` varchar(255) NOT NULL,
    `advice` text NOT NULL,
    `config_status` varchar(255) NOT NULL,
    `disclaimer` varchar(255) NOT NULL,
    `created_at` datetime(6) NOT NULL,
    INDEX `idx_ai_advice_records_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Feedbacks` (
    `id` varchar(255) PRIMARY KEY,
    `user_id` varchar(255) NOT NULL,
    `content` varchar(255) NOT NULL,
    `created_at` datetime(6) NOT NULL,
    INDEX `idx_feedbacks_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Uploads` (
    `id` varchar(255) PRIMARY KEY,
    `file_name` varchar(255) NOT NULL,
    `file_size` int NOT NULL,
    `file_type` varchar(255) NOT NULL,
    `s3_key` varchar(255) NOT NULL,
    `s3_url` varchar(255) NOT NULL,
    `upload_id` varchar(255) NULL,
    `status` varchar(255) NOT NULL,
    `created_at` datetime(6) NOT NULL,
    `updated_at` datetime(6) NOT NULL,
    INDEX `idx_uploads_upload_id` (`upload_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
