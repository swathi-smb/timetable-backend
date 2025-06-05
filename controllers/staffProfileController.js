import Staff from '../models/Staff.js';
import School from '../models/School.js';
import Department from '../models/Department.js';

// Get staff details by email
export const getStaffByEmail = async (req, res) => {
  try {
    const { email } = req.params;
      const staff = await Staff.findOne({
      where: { email_id: email },
      include: [
        { 
          model: School,
          as: 'School',
          attributes: ['school_id', 'school_name']
        },
        {
          model: Department,
          as: 'Department',
          attributes: ['department_id', 'department_name']
        }
      ]
    });if (!staff) {
      return res.status(404).json({ 
        message: 'No staff record found with this email. Please contact your administrator.',
        error: 'STAFF_NOT_FOUND' 
      });
    }

    // Check if the staff is active
    if (!staff.is_active) {
      return res.status(400).json({ 
        message: 'Your staff record is inactive. Please contact your administrator.',
        error: 'STAFF_INACTIVE'
      });
    }

    // Return staff details including school and department
    return res.status(200).json({
      staff_id: staff.staff_id,
      name: staff.staff_name,
      email: staff.email_id,
      school: staff.school_id,
      department: staff.department_id,
      schoolName: staff.School?.school_name,
      departmentName: staff.Department?.department_name,
      specialization: staff.specialization
    });
  } catch (error) {
    console.error('Error fetching staff details:', error);    console.error('Server error in getStaffByEmail:', error);
    return res.status(500).json({ 
      message: 'Error fetching staff details. Please try again.',
      error: 'SERVER_ERROR',
      details: error.message 
    });
  }
};