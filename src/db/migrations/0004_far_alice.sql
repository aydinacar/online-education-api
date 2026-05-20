CREATE TYPE "public"."question_type" AS ENUM('single_choice', 'multiple_choice', 'true_false', 'open_ended');--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"time_limit" integer,
	"max_attempts" integer,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"type" "question_type" NOT NULL,
	"text" text NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"correct_answer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quiz_id" uuid NOT NULL,
	"score" integer,
	"earned_points" integer,
	"total_points" integer,
	"passed" boolean,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"text_answer" text,
	"is_correct" boolean,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quizzes_lesson_unique" ON "quizzes" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_idx" ON "quiz_questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_options_question_idx" ON "quiz_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_quiz_idx" ON "quiz_attempts" USING btree ("user_id","quiz_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_answers_attempt_question_unique" ON "quiz_answers" USING btree ("attempt_id","question_id");