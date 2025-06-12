import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize, pool } from "./config/db.js"; 
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import { verifyToken, checkRole } from "./middleware/authMiddleware.js";
import subjectRoutes from "./routes/subjectRoutes.js"; 
import timetableRoutes from './routes/timetableRoutes.js';
import pendingUserRoutes from './routes/pendingUserRoutes.js';
import userRoutes from './routes/userRoutes.js';
import staffProfileRoutes from './routes/staffProfileRoutes.js';
// import manageStudentRoutes from './routes/manageStudentRoutes.js';
import savedTimetableRoutes from "./routes/savedTimetableRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", verifyToken, checkRole(["1"]), adminRoutes);
app.use("/api/staff", verifyToken, staffRoutes);
app.use("/api/staff-profile", staffProfileRoutes);  // New staff profile routes (no auth required for registration)
app.use("/api/student", studentRoutes);  // Student routes (including public roll number endpoint)
app.use("/api/schools", schoolRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timetable", timetableRoutes);
app.use('/api/users', pendingUserRoutes);
app.use('/api/users', userRoutes);
// Debug middleware for saved timetables
app.use("/api/saved-timetables", (req, res, next) => {
  console.log('[Server] Saved timetables request:', {
    method: req.method,
    url: req.url,
    body: req.body
  });
  next();
}, savedTimetableRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Add modified_date column if it doesn't exist
    const [results] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'modified_date'
    `);
    
    if (results[0].count === 0) {
      await pool.query(`
        ALTER TABLE courses 
        ADD COLUMN modified_date DATETIME 
        DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('Added modified_date column to courses table');
    }

    // Update existing records to have current timestamp
    await pool.query(`
      UPDATE courses 
      SET modified_date = CURRENT_TIMESTAMP 
      WHERE modified_date IS NULL
    `);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();