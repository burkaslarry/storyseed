-- StorySeed PostgreSQL schema (Render). All objects prefixed with storyseed_.

DO $$ BEGIN
  CREATE TYPE storyseed_level_code AS ENUM ('P5', 'P6');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE storyseed_member_role AS ENUM ('student', 'teacher', 'tutor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE storyseed_writing_stage AS ENUM ('idea', 'outline', 'draft', 'revision', 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE storyseed_anthology_status AS ENUM ('待編輯', '待導師確認', '已核准', '不收錄');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE storyseed_anthology_category AS ENUM ('Fantasy', 'Mystery', 'Future World', 'Realistic', 'Poetry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS storyseed_users (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  open_id         text UNIQUE,
  name            text,
  email           text,
  login_method    text,
  role            text NOT NULL DEFAULT 'user',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_signed_in  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_classes (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  level       storyseed_level_code NOT NULL,
  title       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_class_members (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id    integer NOT NULL REFERENCES storyseed_classes(id),
  user_id     integer NOT NULL REFERENCES storyseed_users(id),
  school_code text NOT NULL UNIQUE,
  role        storyseed_member_role NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

CREATE TABLE IF NOT EXISTS storyseed_student_accounts (
  id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id           integer NOT NULL REFERENCES storyseed_classes(id),
  user_id            integer REFERENCES storyseed_users(id),
  school_code        text NOT NULL UNIQUE,
  username           text NOT NULL UNIQUE,
  initial_code_hash  text NOT NULL,
  must_change_code   boolean NOT NULL DEFAULT true,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_import_batches (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  imported_by  integer NOT NULL REFERENCES storyseed_users(id),
  class_id     integer NOT NULL REFERENCES storyseed_classes(id),
  row_count    integer NOT NULL,
  status       text NOT NULL DEFAULT 'completed',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_writings (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id  integer NOT NULL REFERENCES storyseed_users(id),
  lesson_no   integer NOT NULL CHECK (lesson_no BETWEEN 1 AND 15),
  level       storyseed_level_code NOT NULL,
  title       text,
  stage       storyseed_writing_stage NOT NULL DEFAULT 'idea',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_no)
);

CREATE TABLE IF NOT EXISTS storyseed_writing_versions (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  writing_id   integer NOT NULL REFERENCES storyseed_writings(id),
  stage        storyseed_writing_stage NOT NULL,
  body         text NOT NULL,
  student_note text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_journey_pieces (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id  integer NOT NULL REFERENCES storyseed_users(id),
  lesson_no   integer NOT NULL CHECK (lesson_no BETWEEN 1 AND 15),
  writing_id  integer REFERENCES storyseed_writings(id),
  body        text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_no)
);

CREATE TABLE IF NOT EXISTS storyseed_writing_evaluations (
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

CREATE TABLE IF NOT EXISTS storyseed_feedback (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  writing_id  integer NOT NULL REFERENCES storyseed_writings(id),
  author_id   integer NOT NULL REFERENCES storyseed_users(id),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_anthology_items (
  id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  writing_id         integer UNIQUE REFERENCES storyseed_writings(id),
  author_code        text NOT NULL,
  publication_title  text NOT NULL,
  level              storyseed_level_code NOT NULL,
  category           storyseed_anthology_category NOT NULL DEFAULT 'Fantasy',
  status             storyseed_anthology_status NOT NULL DEFAULT '待編輯',
  body               text NOT NULL,
  editor_note        text NOT NULL DEFAULT '',
  student_confirmed  boolean NOT NULL DEFAULT false,
  display_order      integer NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyseed_anthology_exports (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_by  integer NOT NULL REFERENCES storyseed_users(id),
  format      text NOT NULL CHECK (format IN ('pdf', 'csv')),
  storage_key text NOT NULL,
  item_count  integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW storyseed_class_overview AS
SELECT
  c.level AS code,
  COUNT(DISTINCT sa.id)::int AS students,
  COUNT(DISTINCT w.id)::int AS pieces,
  COUNT(DISTINCT ai.id) FILTER (WHERE ai.status IN ('待編輯', '待導師確認'))::int AS pending,
  COUNT(DISTINCT ai.id) FILTER (WHERE ai.status = '已核准')::int AS approved
FROM storyseed_classes c
LEFT JOIN storyseed_student_accounts sa ON sa.class_id = c.id AND sa.active
LEFT JOIN storyseed_class_members cm ON cm.class_id = c.id AND cm.role = 'student'
LEFT JOIN storyseed_writings w ON w.student_id = cm.user_id
LEFT JOIN storyseed_anthology_items ai ON ai.writing_id = w.id
GROUP BY c.level;
