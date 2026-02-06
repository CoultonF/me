CREATE TABLE `activity_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`steps` integer,
	`active_calories` integer,
	`exercise_minutes` integer,
	`stand_hours` integer,
	`move_goal` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_summaries_date_unique` ON `activity_summaries` (`date`);--> statement-breakpoint
CREATE TABLE `glucose_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`value` real NOT NULL,
	`trend` text,
	`source` text DEFAULT 'dexcom'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `glucose_readings_timestamp_idx` ON `glucose_readings` (`timestamp`);--> statement-breakpoint
CREATE TABLE `insulin_doses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`units` real NOT NULL,
	`type` text NOT NULL,
	`source` text DEFAULT 'loop'
);
--> statement-breakpoint
CREATE TABLE `running_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`distance_km` real,
	`duration_seconds` integer,
	`avg_pace_sec_per_km` integer,
	`avg_heart_rate` integer,
	`max_heart_rate` integer,
	`elevation_gain_m` real
);
