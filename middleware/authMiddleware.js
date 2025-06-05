import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Verify Token Middleware
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token from 'Bearer <token>'
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Error:', error.message); // Log error for debugging
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Role Checking Middleware
export const checkRole = (requiredRoleId) => (req, res, next) => {
  if (!req.user || parseInt(req.user.roleId, 10) !== requiredRoleId) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  next();
};

// Specific Role Middleware (Shortcut for Readability)
export const isAdmin = checkRole(1);
export const isStaff = checkRole(2);
export const isStudent = checkRole(3);
