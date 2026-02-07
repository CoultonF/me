CREATE TABLE `race_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`race_id` integer NOT NULL,
	`bib_number` text,
	`chip_time` text,
	`gun_time` text,
	`pace_per_km` text,
	`city` text,
	`division` text,
	`overall_place` integer,
	`overall_total` integer,
	`gender_place` integer,
	`gender_total` integer,
	`division_place` integer,
	`division_total` integer,
	`results_url` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `race_results_race_id_idx` ON `race_results` (`race_id`);--> statement-breakpoint
CREATE TABLE `races` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`location` text,
	`distance` text NOT NULL,
	`status` text NOT NULL,
	`results_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `races_name_date_idx` ON `races` (`name`,`date`);