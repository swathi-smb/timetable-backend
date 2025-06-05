import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import PendingUser from "../models/PendingUser.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import nodemailer from "nodemailer";
import { Op } from "sequelize";

//  Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request body:", req.body);
  console.log("Attempting to find user with email or roll_number:", email);

  try {
    // First check if the user is pending
    const pendingUser = await PendingUser.findOne({ 
      where: { email, status: 'pending' }
    });

    if (pendingUser) {
      // For pending users, compare with the password field
      const isPendingPasswordValid = await bcrypt.compare(password, pendingUser.password);
      if (!isPendingPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      return res.status(401).json({
        message: "Your account is pending admin approval",
        status: 'pending'
      });
    }

    // If not pending, proceed with normal login
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { role_number: email }
        ]
      }
    });
    console.log("Found user:", user ? "Yes" : "No");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Checking password...");
    if (!user.password_hash) {
      console.log("No password hash found for user");
      return res.status(400).json({ message: "Invalid credentials - No password set" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials - Incorrect password" });
    }

    const token = jwt.sign(
      { userId: user.user_id, roleId: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role_id: user.role_id
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login", error: error.message });
  }
};

// Signup Controller
export const signup = async (req, res) => {
  try {
    console.log("Signup Request Body:", req.body);
    const { email, password, role, name } = req.body;
    let { school_id, department_id, role_number } = req.body;

    // Convert and validate role
    const roleStr = role?.toString();

    // Validate required fields based on role
    if (roleStr === '2') {
      // For staff, email is required
      if (!email || !password || !roleStr) {
        return res.status(400).json({ message: 'Email, password and role are required for staff' });
      }
    } else if (roleStr === '3') {
      // For students, roll number is required
      if (!role_number || !password || !roleStr) {
        return res.status(400).json({ 
          message: 'Roll number, password and role are required for students' 
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // For staff members, fetch details from staff table
    if (roleStr === '2') {
      const staffRecord = await Staff.findOne({
        where: { email_id: email }
      });

      if (!staffRecord) {
        return res.status(404).json({
          message: 'No staff record found with this email. Please contact your administrator.',
          error: 'STAFF_NOT_FOUND'
        });
      }

      // Use the school and department from staff record
      department_id = staffRecord.department_id;
      school_id = staffRecord.school_id;
    } else if (roleStr === '3') {
      // For students, validate that the roll number exists
      const studentRecord = await Student.findOne({
        where: { roll_number: role_number }
      });

      if (!studentRecord) {
        return res.status(404).json({
          message: 'No student record found with this roll number. Please contact your administrator.',
          error: 'STUDENT_NOT_FOUND'
        });
      }

      // Use the school and department from student record
      department_id = studentRecord.department_id;
      school_id = studentRecord.school_id;

      // Check if a user with this roll number already exists
      const existingUser = await User.findOne({ 
        where: { role_number }
      });
      const existingPending = await PendingUser.findOne({ 
        where: { role_number }
      });

      if (existingUser || existingPending) {
        return res.status(400).json({ 
          message: 'A user with this roll number is already registered' 
        });
      }
    }

    // Check if email already exists (only for staff)
    if (roleStr === '2') {
      const existingUser = await User.findOne({ where: { email } });
      const existingPending = await PendingUser.findOne({ where: { email } });

      if (existingUser || existingPending) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    // Create pending user record
    await PendingUser.create({
      name: roleStr === '2' ? email.split('@')[0] : role_number,
      email: roleStr === '2' ? email : null,
      password: await bcrypt.hash(password, 10),
      role: roleStr,
      school_id: parseInt(school_id, 10),
      department_id: parseInt(department_id, 10),
      role_number: roleStr === '3' ? role_number : null,
      status: 'pending'
    });

    res.status(201).json({ 
      message: 'Registration request submitted successfully. Please wait for admin approval.' 
    });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: user.user_id, roleId: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // save token in DB
    user.reset_token = token;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password Controller
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findOne({ where: { user_id: decoded.userId, reset_token: token } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password_hash = hashedPassword;
    user.reset_token = null;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
