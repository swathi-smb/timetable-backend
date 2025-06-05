-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the existing foreign key constraint
ALTER TABLE timetables DROP FOREIGN KEY IF EXISTS `timetables_ibfk_4`;

-- Modify the staff_id column to use TEXT type to handle multiple comma-separated IDs
ALTER TABLE timetables 
MODIFY COLUMN staff_id TEXT NULL,
MODIFY COLUMN staff_name TEXT NULL;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
