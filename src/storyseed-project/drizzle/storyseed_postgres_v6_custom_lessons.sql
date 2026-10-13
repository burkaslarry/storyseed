-- Built-in lessons use 1..15; teacher-created assignments use 1000 and above.
ALTER TABLE storyseed_writings DROP CONSTRAINT IF EXISTS storyseed_writings_lesson_no_check;
ALTER TABLE storyseed_writings ADD CONSTRAINT storyseed_writings_lesson_no_check
  CHECK (lesson_no BETWEEN 1 AND 15 OR lesson_no >= 1000);
