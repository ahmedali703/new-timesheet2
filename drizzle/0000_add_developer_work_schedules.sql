-- Add developer_work_schedules table
CREATE TABLE IF NOT EXISTS "developer_work_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "days_per_week" integer NOT NULL DEFAULT 5,
  "hours_per_day" integer NOT NULL DEFAULT 8,
  "expected_payout" numeric(10, 2),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "developer_work_schedules_user_id_unique" UNIQUE ("user_id")
);
