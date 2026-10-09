-- Teacher writing assignments + admin/teacher management support

CREATE TABLE IF NOT EXISTS storyseed_class_assignments (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id        integer NOT NULL REFERENCES storyseed_classes(id),
  created_by      integer NOT NULL REFERENCES storyseed_users(id),
  title           text NOT NULL,
  instructions    text NOT NULL DEFAULT '',
  level           storyseed_level_code NOT NULL,
  lesson_no       integer NOT NULL,
  status          text NOT NULL DEFAULT 'draft',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, lesson_no)
);

CREATE INDEX IF NOT EXISTS storyseed_class_assignments_class_idx
  ON storyseed_class_assignments (class_id, status);
