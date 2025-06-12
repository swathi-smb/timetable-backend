// routes/timetableRoutes.js
import express from 'express';
import {
  getSubjects,
  getStaff,
  saveAllocations,
  generateTimetable,
  getGeneratedTimetables,
  getSubjectsDetails,
} from '../controllers/timetableController.js';
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";
import GeneratedTimetable from '../models/GeneratedTimetable.js';

const router = express.Router();

// Add debug middleware
const debugMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body
  });
  next();
};

router.use(debugMiddleware);

// Public routes
router.get('/subjects', getSubjects);
router.get('/staff', getStaff);
router.get('/subjects/details', getSubjectsDetails);

// Protected routes
router.post('/allocate', verifyToken, saveAllocations);
router.post('/generate', verifyToken, generateTimetable);
router.get('/generated', verifyToken, getGeneratedTimetables);

// Additional protected routes
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const timetable = await GeneratedTimetable.findByPk(req.params.id);
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

router.get('/department/:department_id', verifyToken, async (req, res) => {
  try {
    const { academic_year, semester } = req.query;
    const where = { department_id: req.params.department_id };
    
    if (academic_year) where.academic_year = academic_year;
    if (semester) where.semester = semester;

    const timetables = await GeneratedTimetable.findAll({ where });
    res.json(timetables);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ error: 'Failed to fetch timetables' });
  }
});

export default router;