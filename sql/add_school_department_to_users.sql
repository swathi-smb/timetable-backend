-- Add school_id and department_id columns to users table
ALTER TABLE users
ADD COLUMN school_id INT,
ADD COLUMN department_id INT,
ADD CONSTRAINT fk_user_school FOREIGN KEY (school_id) REFERENCES schools(school_id),
ADD CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES departments(department_id);
