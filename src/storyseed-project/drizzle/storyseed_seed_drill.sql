-- Drill seed: trash + student + teacher + writing + assessment (idempotent)

INSERT INTO storyseed_classes (code, level, title)
VALUES ('6F', 'P6', 'P6 StorySeed Demo')
ON CONFLICT (code) DO NOTHING;

INSERT INTO storyseed_users (open_id, name, login_method, role)
VALUES
  ('student_student-p6-drill', 'Student P6-DRILL', 'school-code', 'student'),
  ('teacher_drill@storyseed.local', 'Teacher Drill', 'oauth', 'teacher'),
  ('trash_drill_disposable', 'Trash Drill', 'school-code', 'student')
ON CONFLICT (open_id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;

INSERT INTO storyseed_students (user_id, school_code, class_id, level)
SELECT u.id, 'P6-DRILL', c.id, 'P6'::storyseed_level_code
FROM storyseed_users u
JOIN storyseed_classes c ON c.code = '6F'
WHERE u.open_id = 'student_student-p6-drill'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO storyseed_student_accounts (class_id, user_id, school_code, username, initial_code_hash, must_change_code, active)
SELECT c.id, u.id, 'P6-DRILL', 'student-p6-drill',
  'f62a0fcccc330dab3d27af8c2a66903b:241e2349355a55fec9d1c32c2b759fc29debb54df1d31cba7109a923e4d2d1d2',
  false, true
FROM storyseed_users u
JOIN storyseed_classes c ON c.code = '6F'
WHERE u.open_id = 'student_student-p6-drill'
ON CONFLICT (username) DO UPDATE SET user_id = EXCLUDED.user_id, initial_code_hash = EXCLUDED.initial_code_hash, must_change_code = false, active = true;

INSERT INTO storyseed_teachers (user_id, display_name)
SELECT id, 'Drill Teacher' FROM storyseed_users WHERE open_id = 'teacher_drill@storyseed.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO storyseed_trash_accounts (username, original_user_id, reason)
SELECT 'trash-drill-user', u.id, 'SRAA disposable drill account'
FROM storyseed_users u
WHERE u.open_id = 'trash_drill_disposable'
AND NOT EXISTS (SELECT 1 FROM storyseed_trash_accounts t WHERE t.username = 'trash-drill-user');

INSERT INTO storyseed_writings (student_id, lesson_no, level, title, stage, status)
SELECT u.id, 1, 'P6'::storyseed_level_code, 'The Door in the Garden', 'draft', 'submitted'
FROM storyseed_users u WHERE u.open_id = 'student_student-p6-drill'
ON CONFLICT (student_id, lesson_no) DO NOTHING;

INSERT INTO storyseed_writing_versions (writing_id, stage, body, student_note)
SELECT w.id, 'draft',
  '星期六早上，我在校園後的小花園發現一扇以前沒有見過的門。',
  'drill seed'
FROM storyseed_writings w
JOIN storyseed_users u ON u.id = w.student_id AND u.open_id = 'student_student-p6-drill'
WHERE w.lesson_no = 1
AND NOT EXISTS (SELECT 1 FROM storyseed_writing_versions v WHERE v.writing_id = w.id);

INSERT INTO storyseed_writing_assessments (writing_id, level, evaluation, reflection)
SELECT w.id, 'P6'::storyseed_level_code,
  '{"level":"P6","rubric":[{"key":"ideasVoice","label":"Ideas & Creativity","score":18,"reason":"Clear creative goal."},{"key":"structure","label":"Structure","score":17,"reason":"Opening connects to detail."},{"key":"language","label":"Language","score":16,"reason":"Word choice fits P6."},{"key":"revision","label":"Revision Effort","score":15,"reason":"Student attempted one revision."}],"strengths":["Original voice"],"nextSteps":["Check verb tense"],"issues":[{"id":"i1","category":"grammar","fragment":"發現一扇","explanation":"Check tense consistency.","hint":"Read aloud and pick the tense you want.","studentRevision":"","status":"pending"}]}'::jsonb,
  'Drill reflection: I checked my verbs.'
FROM storyseed_writings w
JOIN storyseed_users u ON u.id = w.student_id AND u.open_id = 'student_student-p6-drill'
WHERE w.lesson_no = 1
ON CONFLICT (writing_id) DO NOTHING;

INSERT INTO storyseed_anthology_items (writing_id, author_code, publication_title, level, category, status, body, editor_note, student_confirmed, display_order, approved)
SELECT w.id, 'P6-DRILL', 'The Door in the Garden', 'P6'::storyseed_level_code, 'Fantasy'::storyseed_anthology_category, '待導師確認'::storyseed_anthology_status,
  v.body, 'Drill editorial note', true, 1, false
FROM storyseed_writings w
JOIN storyseed_users u ON u.id = w.student_id AND u.open_id = 'student_student-p6-drill'
JOIN storyseed_writing_versions v ON v.writing_id = w.id
WHERE w.lesson_no = 1
ON CONFLICT (writing_id) DO NOTHING;
