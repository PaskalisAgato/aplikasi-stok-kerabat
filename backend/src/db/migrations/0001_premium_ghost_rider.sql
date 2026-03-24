CREATE TABLE "backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"size" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_price_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"old_price" numeric(12, 2) NOT NULL,
	"new_price" numeric(12, 2) NOT NULL,
	"old_discount" numeric(12, 2) DEFAULT '0',
	"new_discount" numeric(12, 2) DEFAULT '0',
	"changed_by" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"response_time" integer NOT NULL,
	"payload_size" integer NOT NULL,
	"status_code" integer NOT NULL,
	"user_id" text,
	"error_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"todo_id" integer NOT NULL,
	"completed_by" text NOT NULL,
	"photo_proof" text,
	"external_photo_proof" text,
	"completion_time" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "external_check_in_photo" text;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "external_check_out_photo" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "external_receipt_url" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "external_image_url" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "version" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "external_image_url" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "external_photo_proof" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "external_image_url" text;--> statement-breakpoint
ALTER TABLE "inventory_price_logs" ADD CONSTRAINT "inventory_price_logs_item_id_inventory_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_price_logs" ADD CONSTRAINT "inventory_price_logs_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_completions" ADD CONSTRAINT "todo_completions_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_completions" ADD CONSTRAINT "todo_completions_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_logs_item_idx" ON "inventory_price_logs" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "price_logs_timestamp_idx" ON "inventory_price_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "logs_path_idx" ON "system_logs" USING btree ("path");--> statement-breakpoint
CREATE INDEX "logs_created_at_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "todo_completions_todo_idx" ON "todo_completions" USING btree ("todo_id");--> statement-breakpoint
CREATE INDEX "todo_completions_user_idx" ON "todo_completions" USING btree ("completed_by");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_created_at_idx" ON "expenses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "expenses_user_id_idx" ON "expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "inventory_created_at_idx" ON "inventory" USING btree ("created_at");