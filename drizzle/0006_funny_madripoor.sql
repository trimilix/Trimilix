ALTER TABLE `holdings` ADD CONSTRAINT `holdings_portfolio_ticker_unique` UNIQUE(`portfolioId`,`etfTicker`);--> statement-breakpoint
ALTER TABLE `etfs` ADD CONSTRAINT `etfs_ter_nonnegative` CHECK (`etfs`.`ter` IS NULL OR `etfs`.`ter` >= 0);--> statement-breakpoint
ALTER TABLE `etfs` ADD CONSTRAINT `etfs_risk_score_range` CHECK (`etfs`.`riskScore` IS NULL OR (`etfs`.`riskScore` BETWEEN 1 AND 5));--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_target_amount_positive` CHECK (`goals`.`targetAmount` > 0);--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_current_amount_nonnegative` CHECK (`goals`.`currentAmount` >= 0);--> statement-breakpoint
ALTER TABLE `holdings` ADD CONSTRAINT `holdings_shares_positive` CHECK (`holdings`.`shares` > 0);--> statement-breakpoint
ALTER TABLE `holdings` ADD CONSTRAINT `holdings_purchase_price_nonnegative` CHECK (`holdings`.`purchasePrice` >= 0);--> statement-breakpoint
ALTER TABLE `holdings` ADD CONSTRAINT `holdings_current_price_nonnegative` CHECK (`holdings`.`currentPrice` >= 0);--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_total_value_nonnegative` CHECK (`portfolios`.`totalValue` >= 0);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_session_version_positive` CHECK (`users`.`sessionVersion` >= 1);--> statement-breakpoint
CREATE INDEX `goals_user_id_idx` ON `goals` (`userId`);--> statement-breakpoint
CREATE INDEX `holdings_portfolio_id_idx` ON `holdings` (`portfolioId`);--> statement-breakpoint
CREATE INDEX `portfolios_user_id_idx` ON `portfolios` (`userId`);