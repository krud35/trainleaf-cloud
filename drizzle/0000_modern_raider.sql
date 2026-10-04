CREATE TABLE `planner_state` (
	`owner` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sheet_connections` (
	`owner` text NOT NULL,
	`profile_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`secret` text NOT NULL,
	`spreadsheet_id` text NOT NULL,
	PRIMARY KEY(`owner`, `profile_id`)
);
