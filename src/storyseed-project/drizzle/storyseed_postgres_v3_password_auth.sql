-- Email/password auth (MD5) for teachers; student codes also MD5 in initial_code_hash

ALTER TABLE storyseed_users
  ADD COLUMN IF NOT EXISTS password_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS storyseed_users_email_lower
  ON storyseed_users (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';
