import express from 'express';
import { getUserDetailsByEmail } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug middleware for user routes
router.use((req, res, next) => {
  console.log('[User Routes] Request:', {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Route to get user details by email or userId
router.get('/details/:identifier', verifyToken, getUserDetailsByEmail);

export default router;