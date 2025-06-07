import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import SavedTimetable from '../models/SavedTimetable.js';

const router = express.Router();

// Debug middleware specific to saved timetables routes
router.use((req, res, next) => {
  console.log('[SavedTimetables] Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  next();
});

router.post('/save', verifyToken, async (req, res) => {
  console.log('[SavedTimetables] Save request received:', {
    body: req.body,
    user: req.user
  });
  try {
    const { 
      name, 
      timetable_data, 
      course_id, 
      department_id, 
      school_id, 
      course_name 
    } = req.body;
    
    // Debug user object
    console.log('[SavedTimetables] User object:', req.user);
      const userId = req.user.userId; // Changed from user_id to userId based on the token structure
    
    if (!name || !timetable_data || !course_id) {
      console.error('[SavedTimetables] Missing required fields:', {
        hasName: !!name,
        hasTimetableData: !!timetable_data,
        hasCourseId: !!course_id
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (!req.user?.userId) {
      console.error('[SavedTimetables] No user ID found in token');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated properly'
      });
    }

    const savedTimetable = await SavedTimetable.create({
      name,
      timetable_data,
      course_id,
      department_id,
      school_id,
      course_name,
      created_by: req.user.userId // Using userId from the token instead of user_id
    });

    res.status(201).json({
      success: true,
      data: savedTimetable
    });
  } catch (error) {
    console.error('Error saving timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving timetable',
      error: error.message
    });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const savedTimetables = await SavedTimetable.findAll({
      where: { created_by: userId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: savedTimetables
    });
  } catch (error) {
    console.error('Error fetching saved timetables:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved timetables',
      error: error.message
    });
  }
});

export default router;
