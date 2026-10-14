-- [F011][S022] Extend storyseed student accounts without replacing existing tables or works.
BEGIN;
ALTER TABLE storyseed_student_accounts ADD COLUMN IF NOT EXISTS student_name text;
ALTER TABLE storyseed_student_accounts ADD COLUMN IF NOT EXISTS student_email text;
CREATE UNIQUE INDEX IF NOT EXISTS storyseed_student_accounts_email_unique ON storyseed_student_accounts (lower(student_email)) WHERE student_email IS NOT NULL;
COMMIT;
