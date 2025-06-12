import pool  from '../config/db.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';

// Get all students with optional filters
export const getStudents = async (req, res) => {
  try {
    const { school_id, department_id, course_id } = req.query;
    
    console.log('Received query parameters:', { school_id, department_id, course_id });
    
    let query = `
      SELECT s.*, c.course_name, d.department_name, sch.school_name
      FROM students s
      JOIN courses c ON s.course_id = c.course_id
      JOIN departments d ON c.department_id = d.department_id
      JOIN schools sch ON d.school_id = sch.school_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (school_id) {
      query += ' AND sch.school_id = ?';
      params.push(parseInt(school_id));
    }
    
    if (department_id) {
      query += ' AND d.department_id = ?';
      params.push(parseInt(department_id));
    }
    
    if (course_id) {
      query += ' AND c.course_id = ?';
      params.push(parseInt(course_id));
    }
    
    console.log('Final SQL Query:', query);
    console.log('Query Parameters:', params);
    
    const [students] = await pool.query(query, params);
    console.log('Query result:', students);
    
    res.json(students);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql,
      stack: error.stack
    });
    
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: error.message
    });
  }
};

// Get student details by roll number
export const getStudentByRollNumber = async (req, res) => {
  try {
    const { roll_number } = req.params;
    const student = await Student.findOne({
      where: { roll_number },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['school_id', 'school_name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['department_id', 'department_name']
        },
        {
          model: Course,
          attributes: ['course_id', 'course_name']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      school_id: student.School.school_id,
      school_name: student.School.school_name,
      department_id: student.department.department_id,
      department_name: student.department.department_name,
      course_id: student.Course.course_id,
      course_name: student.Course.course_name
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student details' });
  }
};

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const { name, roll_number, school_id, department_id, course_id, semester } = req.body;
    const user_id = req.user?.user_id; // Get the user ID from the authenticated user
    
    // Validate required fields
    if (!name || !roll_number || !school_id || !department_id || !course_id || !semester) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if roll number already exists
    const existingStudent = await Student.findOne({
      where: { roll_number }
    });
    
    if (existingStudent) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }
    
    // Insert new student using Sequelize
    const newStudent = await Student.create({
      student_name: name,
      roll_number: roll_number,
      school_id: school_id,
      department_id: department_id,
      course_id: course_id,
      semester: parseInt(semester),
      added_by: user_id,
      modified_by: user_id
    });
    
    res.status(201).json({
      message: 'Student created successfully',
      studentId: newStudent.student_id
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

// Approve a student
export const approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id; // Get the user ID from the authenticated user
    
    // Check if student exists
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update student approval status
    await student.update({
      is_approved: true,
      modified_by: user_id,
      modified_date: new Date()
    });
    
    res.json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ message: 'Error approving student', error: error.message });
  }
};

// Update a student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roll_number, school_id, department_id, course_id, semester } = req.body;
    const user_id = req.user?.user_id; // Get the user ID from the authenticated user
    
    // Validate required fields
    if (!name || !roll_number || !school_id || !department_id || !course_id || !semester) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if roll number exists for other students
    const [existingStudent] = await pool.promise().query(
      'SELECT * FROM students WHERE roll_number = ? AND student_id != ?',
      [roll_number, id]
    );
    
    if (existingStudent.length > 0) {
      return res.status(400).json({ message: 'Roll number already exists for another student' });
    }
    
    // Update student
    await pool.promise().query(
      `UPDATE students 
       SET student_name = ?, 
           roll_number = ?, 
           school_id = ?, 
           department_id = ?, 
           course_id = ?, 
           semester = ?,
           modified_date = CURRENT_TIMESTAMP,
           modified_by = ?
       WHERE student_id = ?`,
      [name, roll_number, school_id, department_id, course_id, parseInt(semester), user_id, id]
    );
    
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Check if student exists
    const [studentRows] = await pool.promise().query(
      'SELECT * FROM students WHERE student_id = ?',
      [id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Try deleting the student
    const [deleteResult] = await pool.promise().query(
      'DELETE FROM students WHERE student_id = ?',
      [id]
    );

    // Optional: confirm row was deleted
    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({ message: 'Student could not be deleted' });
    }

    res.json({ message: '✅ Student deleted successfully', deletedId: id });
  } catch (error) {
    console.error('Error deleting student:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });

    res.status(500).json({
      message: '❌ Error deleting student',
      error: error.sqlMessage || error.message
    });
  }
};
