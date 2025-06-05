import PendingUser from "../models/PendingUser.js";
import Student from "../models/Student.js";
import User from "../models/userModel.js";
import Staff from "../models/Staff.js";
import School from "../models/School.js";
import Department from "../models/Department.js";
import Course from "../models/Course.js";
import db from "../config/db.js";
import { Op } from "sequelize";

// Initialize models
const models = {
  PendingUser,
  Student,
  User,
  Staff,
  School,
  Department,
  Course
};

// Ensure all models are properly initialized
Object.values(models).forEach(model => {
  if (!model || typeof model.findOne !== 'function') {
    console.error(`Model not properly initialized: ${model}`);
  }
});

export const getUserDetailsByEmail = async (req, res) => {
  const { identifier } = req.params;
  console.log('[User Controller] Fetching user details for identifier:', identifier);
  
  try {
    // Try to find user by email or userId
    console.log('[User Controller] Attempting to find user with:', {
      email: identifier,
      userId: identifier
    });
    
    const user = await User.findOne({
      where: { 
        [Op.or]: [
          { email: identifier },
          { user_id: identifier } // This allows lookup by userId as well
        ]
      }
    });

    console.log('[User Controller] User lookup result:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('[User Controller] No user found for identifier:', identifier);
      return res.status(404).json({ message: 'User not found' });
    }

    // For staff role, get staff details
    if (user.role_id === 2) {
      console.log('[User Controller] Fetching staff details for user:', user.user_id);
      
      const staff = await Staff.findOne({
        where: { 
          [Op.or]: [
            { email_id: user.email }, // Use user's email
            { staff_id: user.user_id } // Or use userId for lookup
          ]
        },
        include: [
          { model: School, as: 'School', attributes: ['school_id', 'school_name'] },
          { model: Department, as: 'Department', attributes: ['department_id', 'department_name'] }
        ]
      });

      console.log('[User Controller] Staff lookup result:', staff ? 'Found' : 'Not found');

      if (!staff) {
        console.log('[User Controller] No staff record found for user:', user.user_id);
        return res.status(404).json({ message: 'Staff details not found' });
      }

      if (!staff.is_active) {
        console.log('[User Controller] Staff account is inactive:', user.user_id);
        return res.status(403).json({
          message: 'Staff account is inactive. Please contact administrator.'
        });
      }

      const response = {
        name: staff.staff_name,
        school: staff.School?.school_id,
        department: staff.Department?.department_id,
        schoolName: staff.School?.school_name,
        departmentName: staff.Department?.department_name
      };

      console.log('[User Controller] Sending staff details response:', response);
      return res.status(200).json(response);
    }

    // For student role, get student details
    if (user.role_id === 3) {
      console.log('Fetching details for student with role_number:', user.role_number);
      
      const student = await Student.findOne({
        where: { 
          roll_number: user.role_number
        },
        include: [
          { model: School, attributes: ['school_id', 'school_name'] },
          { model: Department, as: 'department', attributes: ['department_id', 'department_name'] },
          { model: Course, attributes: ['course_id', 'course_name'] }
        ]
      });

      console.log('Found student:', student);

      if (!student) {
        return res.status(404).json({ message: 'Student details not found' });
      }

      // Validate required fields
      if (!student.school_id || !student.department_id || !student.course_id || !student.semester) {
        console.error('Missing required fields in student record:', {
          school_id: student.school_id,
          department_id: student.department_id,
          course_id: student.course_id,
          semester: student.semester
        });
        return res.status(400).json({ 
          message: 'Student record is incomplete. Please contact administrator.',
          missingFields: {
            school: !student.school_id,
            department: !student.department_id,
            course: !student.course_id,
            semester: !student.semester
          }
        });
      }

      const response = {
        name: student.student_name,
        school: student.school_id,
        department: student.department_id,
        course: student.course_id,
        schoolName: student.School?.school_name,
        departmentName: student.department?.department_name,
        courseName: student.Course?.course_name,
        semester: student.semester
      };

      console.log('Sending student details response:', response);
      return res.status(200).json(response);
    }

    // For other roles, return user details
    return res.status(200).json({
      name: user.username,
      school: user.school_id,
      department: user.department_id,
      schoolName: user.school_name,
      departmentName: user.department_name
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};