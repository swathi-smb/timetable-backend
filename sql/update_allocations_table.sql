-- First, check if the table exists and drop it if it does
DROP TABLE IF EXISTS allocations;

-- Create the table with the correct structure
CREATE TABLE allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  department_id INT NOT NULL,
  course_id INT NOT NULL,
  subject_id INT NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  staff_id INT NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  theory_credits INT NOT NULL DEFAULT 0,
  lab_credits INT NOT NULL DEFAULT 0,
  time_config JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);

-- Drop existing foreign key constraints
ALTER TABLE allocations DROP FOREIGN KEY allocations_ibfk_1;
ALTER TABLE allocations DROP FOREIGN KEY allocations_ibfk_2;

-- Drop existing columns
ALTER TABLE allocations DROP COLUMN class_id;
ALTER TABLE allocations DROP COLUMN section_id;

-- Add new columns if they don't exist
ALTER TABLE allocations 
ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255) NOT NULL,
ADD COLUMN IF NOT EXISTS theory_credits INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lab_credits INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_config JSON NOT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add new foreign key constraints
ALTER TABLE allocations
ADD CONSTRAINT fk_allocations_subject_id FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
ADD CONSTRAINT fk_allocations_staff_id FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE; 