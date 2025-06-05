ALTER TABLE subjects
ADD COLUMN staff_id INT NULL,
ADD CONSTRAINT fk_subject_staff
FOREIGN KEY (staff_id)
REFERENCES staff(staff_id)
ON DELETE SET NULL; 