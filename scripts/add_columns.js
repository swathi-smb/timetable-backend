import pool from '../config/db.js';

const query = `
ALTER TABLE users
ADD COLUMN school_id INT,
ADD COLUMN department_id INT,
ADD CONSTRAINT fk_user_school FOREIGN KEY (school_id) REFERENCES schools(school_id),
ADD CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES departments(department_id);
`;

async function addColumns() {
  try {
    const [results] = await pool.promise().query(query);
    console.log('Successfully added columns:', results);
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
}

addColumns();
