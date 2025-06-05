import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Protected admin routes
router.get('/dashboard', verifyToken, isAdmin, adminController.getDashboard);
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.post('/users', verifyToken, isAdmin, adminController.createUser);
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);

// Other admin-specific routes
router.get('/reports', verifyToken, isAdmin, adminController.getReports);
router.post('/notifications', verifyToken, isAdmin, adminController.sendNotification);

export default router;
