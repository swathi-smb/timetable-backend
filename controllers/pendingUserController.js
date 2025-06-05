import PendingUser from '../models/PendingUser.js';
import User from '../models/userModel.js';
import Staff from '../models/Staff.js';
import School from '../models/School.js';
import Department from '../models/department.js';
import Student from '../models/Student.js';
import bcrypt from 'bcrypt';

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await PendingUser.findAll({
      where: { status: 'pending' },
      order: [['created_at', 'DESC']]
    });
    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Failed to fetch pending users' });
  }
};

export const handleUserApproval = async (req, res) => {
  try {
    const { userId, action } = req.body;
    const pendingUser = await PendingUser.findByPk(userId);

    if (!pendingUser) {
      return res.status(404).json({ message: 'Pending user not found' });
    }

    if (action === 'approve') {
      try {
        // For staff members (role '2'), verify staff record exists
        if (pendingUser.role === '2') {
          const staffRecord = await Staff.findOne({
            where: { 
              email_id: pendingUser.email,
              is_active: true
            },
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
          });

          if (!staffRecord) {
            throw new Error('No active staff record found with this email');
          }

          // Create the actual user with proper field mapping and school/department info
          const user = await User.create({
            username: pendingUser.name,          // map name to username
            email: pendingUser.email,
            password_hash: pendingUser.password, // directly use the hash from PendingUser
            role_id: parseInt(pendingUser.role), // convert role string to role_id number
            school_id: staffRecord.school_id,
            department_id: staffRecord.department_id,
            school_name: staffRecord.School?.school_name,
            department_name: staffRecord.Department?.department_name
          });

          // Update staff record with any additional info if needed
          await staffRecord.update({
            specialization: pendingUser.specialization || staffRecord.specialization
          });

          // Update pending user status
          pendingUser.status = 'approved';
          await pendingUser.save();

          res.json({ 
            message: 'User approved and created successfully',
            schoolName: staffRecord.School?.school_name,
            departmentName: staffRecord.Department?.department_name
          });
        } else if (pendingUser.role === '3') {
          // For students, verify student record exists
          const studentRecord = await Student.findOne({
            where: { 
              roll_number: pendingUser.role_number
            },
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
              }
            ]
          });

          if (!studentRecord) {
            throw new Error('No student record found with this roll number');
          }

          // Create the actual user
          const user = await User.create({
            username: pendingUser.name,
            password_hash: pendingUser.password,
            role_id: parseInt(pendingUser.role),
            school_id: studentRecord.school_id,
            department_id: studentRecord.department_id,
            role_number: pendingUser.role_number,
            school_name: studentRecord.School?.school_name,
            department_name: studentRecord.department.department_name
          });

          // Update student record to mark as approved
          await studentRecord.update({
            is_approved: true
          });

          // Update pending user status
          pendingUser.status = 'approved';
          await pendingUser.save();

          res.json({ 
            message: 'Student approved and created successfully',
            schoolName: studentRecord.School?.school_name,
            departmentName: studentRecord.department.department_name
          });
        } else {
          // For other roles
          const user = await User.create({
            username: pendingUser.name,
            email: pendingUser.email,
            password_hash: pendingUser.password,
            role_id: parseInt(pendingUser.role),
            school_id: pendingUser.school_id,
            department_id: pendingUser.department_id
          });

          pendingUser.status = 'approved';
          await pendingUser.save();

          res.json({ message: 'User approved and created successfully' });
        }
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user account', error: error.message });
      }
    } else if (action === 'reject') {
      pendingUser.status = 'rejected';
      await pendingUser.save();
      res.json({ message: 'User rejected successfully' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling user approval:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};