CREATE TABLE IF NOT EXISTS `planner_quarantine` (
	`owner` text NOT NULL,
	`collection` text NOT NULL,
	`record_key` text NOT NULL,
	`record_id` text,
	`profile_id` text,
	`raw_json` text NOT NULL,
	`rule_codes` text NOT NULL,
	`resolution` text NOT NULL,
	`source_revision` integer NOT NULL,
	`created_at` text NOT NULL,
	`resolved_at` text,
	PRIMARY KEY(`owner`, `collection`, `record_key`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `planner_quarantine_owner_profile` ON `planner_quarantine` (`owner`,`profile_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `planner_state_backups` (
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `revision`)
);
