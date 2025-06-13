import Student from '../models/Student.js';
import School from '../models/School.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';

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
      return res.status(404).json({ 
        message: 'No student record found with this roll number. Please contact your administrator.',
        error: 'STUDENT_NOT_FOUND' 
      });
    }

    // Return student details including school and department
    return res.status(200).json({
      student_id: student.student_id,
      name: student.student_name,
      roll_number: student.roll_number,
      school: student.school_id,
      department: student.department_id,
      schoolName: student.School?.school_name,
      departmentName: student.department?.department_name,
      course: student.course_id,
      courseName: student.Course?.course_name,
      semester: student.semester
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return res.status(500).json({ 
      message: 'Error fetching student details. Please try again.',
      error: 'SERVER_ERROR',
      details: error.message 
    });
  }
}; 