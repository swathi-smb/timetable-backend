import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentByRollNumber,
  approveStudent
} from '../controllers/studentController.js';

const router = express.Router();

// Public route to get student by roll number (for signup)
router.get('/roll/:roll_number', getStudentByRollNumber);

// All routes below should be protected and only accessible by admin
router.use(verifyToken, isAdmin);

// Get all students
router.get('/', getStudents);

// Create new student
router.post('/', createStudent);

// Update student
router.put('/:id', updateStudent);

// Delete student
router.delete('/:id', deleteStudent);

// Approve student
router.put('/:id/approve', approveStudent);

export default router;
