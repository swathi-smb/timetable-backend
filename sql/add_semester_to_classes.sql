-- Add semester column to classes table
ALTER TABLE classes
ADD COLUMN semester INT NOT NULL DEFAULT 1,
ADD CONSTRAINT semester_range CHECK (semester >= 1 AND semester <= 8);

-- Update existing class names to match semester numbers
UPDATE classes
SET semester = CAST(SUBSTRING(class_name, 9) AS UNSIGNED)
WHERE class_name LIKE 'Semester %';

-- Add unique constraint to prevent duplicate semesters per course
ALTER TABLE classes
ADD CONSTRAINT unique_semester_per_course UNIQUE (course_id, semester);
