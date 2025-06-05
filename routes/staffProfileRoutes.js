import express from 'express';
import { getStaffByEmail } from '../controllers/staffProfileController.js';

const router = express.Router();

// Route to check if staff exists by email (used during signup)
router.get('/details/:email', getStaffByEmail);

export default router;