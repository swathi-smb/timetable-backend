-- Add unique constraint to prevent duplicate semesters per course
ALTER TABLE classes
ADD CONSTRAINT unique_semester_per_course UNIQUE (course_id, semester);
