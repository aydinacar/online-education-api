CREATE TYPE "public"."instructor_application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "instructor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"headline" varchar(200) NOT NULL,
	"bio" text NOT NULL,
	"expertise_areas" text[] NOT NULL,
	"diploma_url" text NOT NULL,
	"certificate_urls" text[],
	"sample_syllabus" text,
	"portfolio_url" text,
	"status" "instructor_application_status" DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instructor_applications_user_idx" ON "instructor_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instructor_applications_status_idx" ON "instructor_applications" USING btree ("status");