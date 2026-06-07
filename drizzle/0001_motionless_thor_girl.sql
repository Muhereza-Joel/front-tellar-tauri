PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`country` text,
	`loyalty_points` integer DEFAULT 0,
	`credit_limit` real DEFAULT 0,
	`balance` real DEFAULT 0,
	`is_active` integer DEFAULT true,
	`is_walk_in` integer DEFAULT false,
	`notes` text,
	`last_purchase_at` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
INSERT INTO `__new_customers`("uuid", "branch_id", "first_name", "last_name", "date_of_birth", "email", "phone", "address", "city", "country", "loyalty_points", "credit_limit", "balance", "is_active", "is_walk_in", "notes", "last_purchase_at", "tenant_id", "created_at", "updated_at", "deleted_at", "sync_status") SELECT "uuid", "branch_id", "first_name", "last_name", "date_of_birth", "email", "phone", "address", "city", "country", "loyalty_points", "credit_limit", "balance", "is_active", "is_walk_in", "notes", "last_purchase_at", "tenant_id", "created_at", "updated_at", "deleted_at", "sync_status" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `customers_uuid_unique` ON `customers` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);