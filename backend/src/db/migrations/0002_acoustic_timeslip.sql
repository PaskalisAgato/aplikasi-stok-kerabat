CREATE TABLE "containers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tare_weight" numeric(12, 2) NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"qr_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "containers_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"response_body" text,
	"status_code" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventory_id" integer NOT NULL,
	"gross_weight" numeric(12, 2) NOT NULL,
	"tare_weight" numeric(12, 2) NOT NULL,
	"net_weight" numeric(12, 2) NOT NULL,
	"measured_by" text NOT NULL,
	"source" text DEFAULT 'MANUAL' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "todo_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "ideal_stock" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "container_weight" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "container_id" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "overhead" numeric(5, 2) DEFAULT '10' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "offline_id" text;--> statement-breakpoint
ALTER TABLE "system_logs" ADD COLUMN "level" text DEFAULT 'INFO' NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "interval_type" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "interval_value" integer;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "next_run_at" timestamp;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "photo_upload_mode" text DEFAULT 'both';--> statement-breakpoint
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_measured_by_user_id_fk" FOREIGN KEY ("measured_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshots_inventory_idx" ON "inventory_snapshots" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "snapshots_timestamp_idx" ON "inventory_snapshots" USING btree ("timestamp");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "inventory_stock_idx" ON "inventory" USING btree ("current_stock");--> statement-breakpoint
CREATE INDEX "inventory_min_stock_idx" ON "inventory" USING btree ("min_stock");--> statement-breakpoint
CREATE INDEX "inventory_is_deleted_idx" ON "inventory" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_offline_id_unique" UNIQUE("offline_id");