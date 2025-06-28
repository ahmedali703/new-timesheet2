-- Add payment_evidence table
CREATE TABLE IF NOT EXISTS "payment_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "week_id" uuid NOT NULL REFERENCES "weeks"("id"),
  "filename" text NOT NULL,
  "file_url" text NOT NULL,
  "uploaded_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
