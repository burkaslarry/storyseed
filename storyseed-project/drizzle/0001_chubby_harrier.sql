CREATE TABLE `anthologyItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`writingId` int NOT NULL,
	`displayOrder` int,
	`authorCode` varchar(32) NOT NULL,
	`publicationTitle` varchar(180),
	`approved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anthologyItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `anthologyItems_writingId_unique` UNIQUE(`writingId`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonNo` int NOT NULL,
	`level` enum('P5','P6') NOT NULL,
	`title` varchar(160) NOT NULL,
	`focus` text NOT NULL,
	`promptCard` text,
	`vocabulary` text,
	`plannerHint` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(32) NOT NULL,
	`role` enum('student','teacher','tutor') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `classMembers_schoolCode_unique` UNIQUE(`schoolCode`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`level` enum('P5','P6') NOT NULL,
	`title` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`writingId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `writingVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`writingId` int NOT NULL,
	`stage` enum('idea','outline','draft','revision','submitted') NOT NULL,
	`body` text NOT NULL,
	`studentNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `writingVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `writings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`assignmentId` int NOT NULL,
	`title` varchar(180),
	`stage` enum('idea','outline','draft','revision','submitted') NOT NULL DEFAULT 'idea',
	`status` enum('draft','submitted','approved','selected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `writings_id` PRIMARY KEY(`id`)
);
