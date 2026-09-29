CREATE TABLE `writingEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`writingId` int NOT NULL,
	`level` enum('P5','P6') NOT NULL,
	`evaluationData` text NOT NULL,
	`reflection` text,
	`teacherNote` text,
	`rubricOverrides` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `writingEvaluations_id` PRIMARY KEY(`id`),
	CONSTRAINT `writingEvaluations_writingId_unique` UNIQUE(`writingId`)
);
