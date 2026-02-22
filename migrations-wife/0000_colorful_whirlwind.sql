CREATE TABLE `body_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `body_measurements_type_date_idx` ON `body_measurements` (`type`,`date`);--> statement-breakpoint
CREATE TABLE `daily_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`steps` integer,
	`active_calories` integer,
	`basal_calories` integer,
	`exercise_minutes` integer,
	`stand_hours` integer,
	`walk_distance_km` real,
	`cycle_distance_km` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_activity_date_unique` ON `daily_activity` (`date`);--> statement-breakpoint
CREATE TABLE `heart_rate_daily` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`resting_hr` integer,
	`walking_hr_avg` integer,
	`hrv` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `heart_rate_daily_date_unique` ON `heart_rate_daily` (`date`);--> statement-breakpoint
CREATE TABLE `sleep_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`bedtime` text,
	`wake_time` text,
	`total_minutes` integer,
	`rem_minutes` integer,
	`core_minutes` integer,
	`deep_minutes` integer,
	`awake_minutes` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sleep_sessions_date_unique` ON `sleep_sessions` (`date`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vitals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vitals_type_date_idx` ON `vitals` (`type`,`date`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_type` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration_seconds` integer,
	`distance_km` real,
	`active_calories` integer,
	`avg_heart_rate` integer,
	`max_heart_rate` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workouts_type_start_idx` ON `workouts` (`workout_type`,`start_time`);