ALTER TABLE `insulin_doses` ADD `sub_type` text;--> statement-breakpoint
ALTER TABLE `insulin_doses` ADD `duration` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `insulin_doses_ts_type_idx` ON `insulin_doses` (`timestamp`,`type`);--> statement-breakpoint
ALTER TABLE `running_sessions` ADD `activity_name` text;--> statement-breakpoint
ALTER TABLE `running_sessions` ADD `active_calories` integer;--> statement-breakpoint
ALTER TABLE `running_sessions` ADD `source` text DEFAULT 'tidepool';--> statement-breakpoint
CREATE UNIQUE INDEX `running_sessions_start_time_idx` ON `running_sessions` (`start_time`);