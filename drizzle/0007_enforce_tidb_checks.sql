SET GLOBAL tidb_enable_check_constraint = ON;--> statement-breakpoint

-- TiDB 8.5 can register the older explicit `IS NULL OR` form on an empty table,
-- but reject the same DDL on an existing table. Replace these two named checks
-- with the SQL-standard form; NULL remains valid because only FALSE violates CHECK.
SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'etfs_ter_nonnegative'
    ),
    'ALTER TABLE `etfs` DROP CONSTRAINT `etfs_ter_nonnegative`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint
ALTER TABLE `etfs` ADD CONSTRAINT `etfs_ter_nonnegative` CHECK (`ter` >= 0);--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'etfs_risk_score_range'
    ),
    'ALTER TABLE `etfs` DROP CONSTRAINT `etfs_risk_score_range`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint
ALTER TABLE `etfs` ADD CONSTRAINT `etfs_risk_score_range` CHECK (`riskScore` BETWEEN 1 AND 5);--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'goals_target_amount_positive'
    ),
    'SELECT 1',
    'ALTER TABLE `goals` ADD CONSTRAINT `goals_target_amount_positive` CHECK (`targetAmount` > 0)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'goals_current_amount_nonnegative'
    ),
    'SELECT 1',
    'ALTER TABLE `goals` ADD CONSTRAINT `goals_current_amount_nonnegative` CHECK (`currentAmount` >= 0)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'holdings_shares_positive'
    ),
    'SELECT 1',
    'ALTER TABLE `holdings` ADD CONSTRAINT `holdings_shares_positive` CHECK (`shares` > 0)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'holdings_purchase_price_nonnegative'
    ),
    'SELECT 1',
    'ALTER TABLE `holdings` ADD CONSTRAINT `holdings_purchase_price_nonnegative` CHECK (`purchasePrice` >= 0)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'holdings_current_price_nonnegative'
    ),
    'SELECT 1',
    'ALTER TABLE `holdings` ADD CONSTRAINT `holdings_current_price_nonnegative` CHECK (`currentPrice` >= 0)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'portfolios_total_value_nonnegative'
    ),
    'SELECT 1',
    'ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_total_value_nonnegative` CHECK (`totalValue` >= 0)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;--> statement-breakpoint

SET @constraint_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'users_session_version_positive'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD CONSTRAINT `users_session_version_positive` CHECK (`sessionVersion` >= 1)'
  )
);--> statement-breakpoint
PREPARE constraint_stmt FROM @constraint_sql;--> statement-breakpoint
EXECUTE constraint_stmt;--> statement-breakpoint
DEALLOCATE PREPARE constraint_stmt;