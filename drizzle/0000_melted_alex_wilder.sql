CREATE TYPE "public"."role" AS ENUM('admin', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('video', 'choice', 'end');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "branch_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"time_limit" integer DEFAULT 15 NOT NULL,
	"default_choice_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "branch_configs_node_id_unique" UNIQUE("node_id")
);
--> statement-breakpoint
CREATE TABLE "branch_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"choice_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"text" varchar(100) NOT NULL,
	"target_node_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"file_size" integer,
	"duration" integer,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" "node_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"video_url" text,
	"thumbnail_url" text,
	"choice_display_time" integer,
	"duration" integer,
	"position_x" integer DEFAULT 0 NOT NULL,
	"position_y" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"start_node_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "choice_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"progress_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"choice_id" uuid NOT NULL,
	"response_time" real NOT NULL,
	"is_timeout" boolean DEFAULT false NOT NULL,
	"selected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'not_started' NOT NULL,
	"current_node_id" uuid,
	"total_watch_time" integer DEFAULT 0 NOT NULL,
	"completion_rate" real DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_configs" ADD CONSTRAINT "branch_configs_node_id_video_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."video_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_configs" ADD CONSTRAINT "branch_configs_default_choice_id_choices_id_fk" FOREIGN KEY ("default_choice_id") REFERENCES "public"."choices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_edges" ADD CONSTRAINT "branch_edges_project_id_video_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."video_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_edges" ADD CONSTRAINT "branch_edges_source_node_id_video_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."video_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_edges" ADD CONSTRAINT "branch_edges_target_node_id_video_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."video_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_edges" ADD CONSTRAINT "branch_edges_choice_id_choices_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."choices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choices" ADD CONSTRAINT "choices_node_id_video_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."video_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choices" ADD CONSTRAINT "choices_target_node_id_video_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."video_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_library" ADD CONSTRAINT "video_library_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_nodes" ADD CONSTRAINT "video_nodes_project_id_video_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."video_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_projects" ADD CONSTRAINT "video_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choice_history" ADD CONSTRAINT "choice_history_progress_id_user_progress_id_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."user_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choice_history" ADD CONSTRAINT "choice_history_node_id_video_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."video_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choice_history" ADD CONSTRAINT "choice_history_choice_id_choices_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."choices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_project_id_video_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."video_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_current_node_id_video_nodes_id_fk" FOREIGN KEY ("current_node_id") REFERENCES "public"."video_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "choice_history_progress_idx" ON "choice_history" USING btree ("progress_id");--> statement-breakpoint
CREATE INDEX "choice_history_node_idx" ON "choice_history" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "choice_history_choice_idx" ON "choice_history" USING btree ("choice_id");--> statement-breakpoint
CREATE INDEX "user_progress_user_project_idx" ON "user_progress" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "user_progress_status_idx" ON "user_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_progress_user_idx" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_progress_project_idx" ON "user_progress" USING btree ("project_id");