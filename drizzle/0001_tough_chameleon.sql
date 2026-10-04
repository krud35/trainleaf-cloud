CREATE TABLE `athlete_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`profile_id` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_version` integer DEFAULT 1 NOT NULL,
	`disabled` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `athlete_accounts_owner_profile` ON `athlete_accounts` (`owner`,`profile_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `athlete_accounts_owner_username` ON `athlete_accounts` (`owner`,`username`);--> statement-breakpoint
CREATE TABLE `athlete_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`account_id` text NOT NULL,
	`account_version` integer NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `athlete_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `athlete_sessions_account` ON `athlete_sessions` (`account_id`);--> statement-breakpoint
CREATE INDEX `athlete_sessions_expiry` ON `athlete_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`attempts` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_rate_limits_window` ON `auth_rate_limits` (`window_start`);--> statement-breakpoint
ALTER TABLE `sheet_connections` ADD `auto_sync` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sheet_connections` ADD `last_revision` integer;--> statement-breakpoint
ALTER TABLE `sheet_connections` ADD `last_synced_at` text;--> statement-breakpoint
ALTER TABLE `sheet_connections` ADD `last_error` text;