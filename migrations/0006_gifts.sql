CREATE TABLE `gifts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `price` real,
  `url` text,
  `store` text,
  `rating` integer,
  `date_added` text NOT NULL,
  `category` text NOT NULL,
  `notes` text,
  `purchased` integer DEFAULT false
);

CREATE UNIQUE INDEX `gifts_name_category_idx` ON `gifts` (`name`, `category`);
