-- Teacher ↔ class scope for imports and assignments

CREATE TABLE IF NOT EXISTS storyseed_teacher_classes (
  teacher_user_id integer NOT NULL REFERENCES storyseed_users(id) ON DELETE CASCADE,
  class_id        integer NOT NULL REFERENCES storyseed_classes(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_user_id, class_id)
);

INSERT INTO storyseed_teacher_classes (teacher_user_id, class_id)
SELECT u.id, c.id
FROM storyseed_users u
JOIN storyseed_classes c ON c.code = '6F'
WHERE u.open_id = 'teacher_teacher-drill@chungsing.edu.hk'
ON CONFLICT DO NOTHING;
