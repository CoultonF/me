CREATE TABLE `training_plan` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `date` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `workout_type` text,
  `distance_km` real,
  `target_pace` text,
  `status` text DEFAULT 'planned',
  `ical_uid` text
);

CREATE UNIQUE INDEX `training_plan_date_uid_idx` ON `training_plan` (`date`, `ical_uid`);
