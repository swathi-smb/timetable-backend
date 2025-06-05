import express from 'express';
import { getPendingUsers, handleUserApproval } from '../controllers/pendingUserController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all pending users
router.get('/pending', verifyToken, getPendingUsers);

// Approve or reject a pending user
router.post('/handle-approval', verifyToken, handleUserApproval);

export default router;
