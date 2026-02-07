CREATE TABLE `claude_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0,
	`output_tokens` integer DEFAULT 0,
	`cache_creation_tokens` integer DEFAULT 0,
	`cache_read_tokens` integer DEFAULT 0,
	`cost` real DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claude_usage_date_model_idx` ON `claude_usage` (`date`,`model`);--> statement-breakpoint
CREATE TABLE `github_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_contributions_date_unique` ON `github_contributions` (`date`);--> statement-breakpoint
CREATE TABLE `github_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`repo` text NOT NULL,
	`message` text,
	`ref` text,
	`timestamp` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_events_type_ts_repo_idx` ON `github_events` (`type`,`timestamp`,`repo`);--> statement-breakpoint
CREATE TABLE `github_languages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repo_name` text NOT NULL,
	`language` text NOT NULL,
	`bytes` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_languages_repo_lang_idx` ON `github_languages` (`repo_name`,`language`);--> statement-breakpoint
CREATE TABLE `github_repos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`description` text,
	`url` text NOT NULL,
	`language` text,
	`stars` integer DEFAULT 0,
	`forks` integer DEFAULT 0,
	`is_archived` integer DEFAULT false,
	`is_fork` integer DEFAULT false,
	`updated_at` text,
	`pushed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repos_full_name_unique` ON `github_repos` (`full_name`);