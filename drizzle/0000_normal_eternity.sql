CREATE TABLE `attribute_definitions` (
	`uuid` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`branch_id` text,
	`fieldType` text DEFAULT 'text' NOT NULL,
	`isRequired` integer DEFAULT false,
	`placeholder` text,
	`options` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`service_id` text NOT NULL,
	`variant_id` text,
	`customer_id` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'scheduled',
	`price` real NOT NULL,
	`deposit_paid` real DEFAULT 0,
	`notes` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`country` text,
	`is_main` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`notes` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branches_uuid_unique` ON `branches` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `branches_email_unique` ON `branches` (`email`);--> statement-breakpoint
CREATE TABLE `brands` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_uuid_unique` ON `brands` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `brands_slug_unique` ON `brands` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`parent_id` text,
	`name` text NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_uuid_unique` ON `categories` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `customers` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text,
	`email` text NOT NULL,
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
CREATE UNIQUE INDEX `customers_uuid_unique` ON `customers` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `discounts` (
	`uuid` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`branch_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`start_date` text,
	`end_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discounts_uuid_unique` ON `discounts` (`uuid`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`uuid` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`branch_id` text,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`expense_date` text NOT NULL,
	`payment_method` text NOT NULL,
	`vendor` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_uuid_unique` ON `expenses` (`uuid`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`slug` text NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_uuid_unique` ON `tenants` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `local_roles` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `local_roles_uuid_unique` ON `local_roles` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `local_roles_name_unique` ON `local_roles` (`name`);--> statement-breakpoint
CREATE TABLE `local_permissions` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role_id` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `local_permissions_uuid_unique` ON `local_permissions` (`uuid`);--> statement-breakpoint
CREATE TABLE `local_users` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`email` text NOT NULL,
	`is_email_verified` integer DEFAULT 0 NOT NULL,
	`password` text NOT NULL,
	`role_id` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `local_users_uuid_unique` ON `local_users` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `local_users_email_unique` ON `local_users` (`email`);--> statement-breakpoint
CREATE TABLE `units` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`name` text NOT NULL,
	`singular` text NOT NULL,
	`plural` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `units_uuid_unique` ON `units` (`uuid`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`name` text NOT NULL,
	`contact_person` text,
	`email` text,
	`phone` text,
	`alternative_phone` text,
	`website` text,
	`address` text,
	`city` text,
	`state` text,
	`country` text,
	`postal_code` text,
	`tax_id` text,
	`registration_number` text,
	`payment_terms` text,
	`credit_limit` real DEFAULT 0,
	`payment_days` integer DEFAULT 0,
	`bank_name` text,
	`bank_account_name` text,
	`bank_account_number` text,
	`bank_branch` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_preferred` integer DEFAULT false NOT NULL,
	`rating` integer DEFAULT 0,
	`notes` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE TABLE `products` (
	`uuid` text PRIMARY KEY NOT NULL,
	`sku` text,
	`branch_id` text,
	`barcode` text,
	`name` text NOT NULL,
	`slug` text,
	`description` text,
	`brand_id` text,
	`category_id` text,
	`buying_price` real DEFAULT 0,
	`selling_price` real DEFAULT 0,
	`tax_rate` real DEFAULT 0,
	`is_tax_inclusive` integer DEFAULT true,
	`uom` text DEFAULT 'pcs',
	`current_stock` real DEFAULT 0,
	`minimum_stock_level` real DEFAULT 5,
	`metadata` text,
	`is_active` integer DEFAULT true,
	`has_inventory` integer DEFAULT true,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`product_id` text,
	`sku` text,
	`barcode` text,
	`selling_price` real DEFAULT 0,
	`current_stock` real DEFAULT 0,
	`minimum_stock_level` real DEFAULT 2,
	`attribute_type` text,
	`attribute_value` text,
	`is_active` integer DEFAULT true,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_barcode_unique` ON `product_variants` (`barcode`);--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`uuid` text PRIMARY KEY NOT NULL,
	`purchase_order_uuid` text NOT NULL,
	`product_uuid` text NOT NULL,
	`product_name` text NOT NULL,
	`sku` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`received_quantity` integer DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`total_price` real DEFAULT 0 NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_order_items_uuid_unique` ON `purchase_order_items` (`uuid`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`po_number` text NOT NULL,
	`vendor_uuid` text NOT NULL,
	`vendor_name` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`issue_date` text NOT NULL,
	`expected_delivery_date` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_uuid_unique` ON `purchase_orders` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_po_number_unique` ON `purchase_orders` (`po_number`);--> statement-breakpoint
CREATE TABLE `system_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`name` text NOT NULL,
	`description` text,
	`category_id` text,
	`brand_id` text,
	`base_price` real DEFAULT 0,
	`tax_rate` real DEFAULT 0,
	`is_tax_inclusive` integer DEFAULT true,
	`duration_minutes` integer,
	`requires_appointment` integer DEFAULT true,
	`max_bookings_per_slot` integer DEFAULT 1,
	`is_rental` integer DEFAULT false,
	`deposit_required` real DEFAULT 0,
	`rental_rate_unit` text,
	`late_fee_per_unit` real DEFAULT 0,
	`availability_schedule` text,
	`metadata` text,
	`is_active` integer DEFAULT true,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE TABLE `service_variants` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`service_id` text NOT NULL,
	`sku` text,
	`name` text NOT NULL,
	`description` text,
	`price_adjustment` real DEFAULT 0,
	`absolute_price` real,
	`duration_minutes` integer,
	`deposit_required` real,
	`rental_rate_unit` text,
	`late_fee_per_unit` real,
	`available_quantity` integer DEFAULT 0,
	`minimum_stock_level` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_variants_sku_unique` ON `service_variants` (`sku`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`sale_id` text NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`subtotal` real NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`uuid` text PRIMARY KEY NOT NULL,
	`branch_id` text,
	`customer_id` text,
	`type` text DEFAULT 'DIRECT' NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`discount_id` text,
	`discount_amount` real DEFAULT 0,
	`total_amount` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`tenant_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE TABLE `service_sale_items` (
	`uuid` text PRIMARY KEY NOT NULL,
	`service_sale_id` text NOT NULL,
	`service_id` text NOT NULL,
	`variant_id` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`is_rental` integer DEFAULT false,
	`rental_unit` text,
	`deposit_captured` real DEFAULT 0,
	`branch_id` text,
	`tenant_id` text,
	`sync_status` text DEFAULT 'created',
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_sales` (
	`uuid` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`type` text DEFAULT 'DIRECT' NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`discount_id` text,
	`discount_amount` real DEFAULT 0,
	`total_amount` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`tenant_id` text,
	`branch_id` text,
	`sync_status` text DEFAULT 'created',
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`uuid` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`branch_id` text,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`reference_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`sync_status` text DEFAULT 'created'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_uuid_unique` ON `notes` (`uuid`);