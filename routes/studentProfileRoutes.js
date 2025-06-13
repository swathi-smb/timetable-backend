import express from 'express';
import { getStudentByRollNumber } from '../controllers/studentProfileController.js';

const router = express.Router();

// Route to check if student exists by roll number (used during signup)
router.get('/details/:roll_number', getStudentByRollNumber);

export default router; 