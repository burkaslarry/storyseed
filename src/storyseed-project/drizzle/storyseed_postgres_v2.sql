-- StorySeed Postgres v2: drill tables, assessments, assignments, column fixes

CREATE TABLE IF NOT EXISTS storyseed_students (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     integer NOT NULL UNIQUE REFERENCES storyseed_users(id),
  school_code text NOT NULL UNIQUE,
  class_id    integer REFERENCES storyseed_classes(id),
  level       storyseed_level_code NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_teachers (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      integer NOT NULL UNIQUE REFERENCES storyseed_users(id),
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_trash_accounts (
  id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username         text NOT NULL,
  original_user_id integer REFERENCES storyseed_users(id),
  reason           text,
  deleted_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_assignments (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_no    integer NOT NULL,
  level        storyseed_level_code NOT NULL,
  title        text NOT NULL,
  focus        text NOT NULL,
  prompt_card  text,
  vocabulary   text,
  planner_hint text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level, lesson_no)
);

CREATE TABLE IF NOT EXISTS storyseed_writing_assessments (
  id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  writing_id       integer NOT NULL UNIQUE REFERENCES storyseed_writings(id),
  level            storyseed_level_code NOT NULL,
  evaluation       jsonb NOT NULL,
  reflection       text,
  teacher_note     text,
  rubric_overrides jsonb NOT NULL DEFAULT '{}',
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE storyseed_writings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE storyseed_anthology_items ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
ALTER TABLE storyseed_student_accounts ADD COLUMN IF NOT EXISTS user_id integer REFERENCES storyseed_users(id);

INSERT INTO storyseed_writing_assessments (writing_id, level, evaluation, reflection, teacher_note, rubric_overrides)
SELECT writing_id, level, evaluation, reflection, teacher_note, rubric_overrides
FROM storyseed_writing_evaluations
ON CONFLICT (writing_id) DO NOTHING;

UPDATE storyseed_users SET role = 'student' WHERE role IN ('user', 'student');
UPDATE storyseed_users SET role = 'teacher' WHERE role NOT IN ('student', 'teacher', 'admin');
