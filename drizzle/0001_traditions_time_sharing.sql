CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`template_key` text NOT NULL,
	`voter_id` text NOT NULL,
	`voter_name` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_unique_idx` ON `votes` (`project_id`,`template_key`,`voter_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `share_token` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `tradition_key` text DEFAULT 'north' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `time_key` text DEFAULT 'golden' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_share_token_unique` ON `projects` (`share_token`);