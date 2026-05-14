ALTER TYPE "public"."lesson_type" ADD VALUE 'live';--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_section_id_sections_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "section_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "course_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "meeting_url" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "recording_url" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lessons_course_idx" ON "lessons" USING btree ("course_id");