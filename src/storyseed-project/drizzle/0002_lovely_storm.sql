CREATE TABLE `anthologyExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`format` enum('pdf','csv') NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`itemCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anthologyExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importedBy` int NOT NULL,
	`classId` int NOT NULL,
	`rowCount` int NOT NULL,
	`status` enum('preview','completed','failed') NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `importBatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`schoolCode` varchar(32) NOT NULL,
	`username` varchar(64) NOT NULL,
	`initialCodeHash` varchar(128) NOT NULL,
	`mustChangeCode` int NOT NULL DEFAULT 1,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `studentAccounts_schoolCode_unique` UNIQUE(`schoolCode`),
	CONSTRAINT `studentAccounts_username_unique` UNIQUE(`username`)
);
