ALTER TABLE `etfs` DROP CONSTRAINT `etfs_ter_nonnegative`;--> statement-breakpoint
ALTER TABLE `etfs` DROP CONSTRAINT `etfs_risk_score_range`;--> statement-breakpoint
ALTER TABLE `etfs` ADD CONSTRAINT `etfs_ter_nonnegative` CHECK (`etfs`.`ter` >= 0);--> statement-breakpoint
ALTER TABLE `etfs` ADD CONSTRAINT `etfs_risk_score_range` CHECK (`etfs`.`riskScore` BETWEEN 1 AND 5);