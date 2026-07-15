CREATE TABLE `etfs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`isin` varchar(12),
	`ter` int,
	`currency` varchar(3) NOT NULL,
	`assetClass` varchar(50),
	`region` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `etfs_id` PRIMARY KEY(`id`),
	CONSTRAINT `etfs_symbol_unique` UNIQUE(`symbol`),
	CONSTRAINT `etfs_isin_unique` UNIQUE(`isin`)
);
