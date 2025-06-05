import express from 'express';
import { saveAllocations, generateTimetable, getGeneratedTimetables, getSubjects, getStaff } from '../controllers/timetableController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug middleware for tracking requests
router.use((req, res, next) => {
  // Log incoming request
  console.log(`[Timetable Route] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    params: req.params,
    user: req.user
  });

  // Wrap response methods to log outgoing response
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`[Timetable Route] Response:`, {
      status: res.statusCode,
      data: data
    });
    return originalJson.call(this, data);
  };

  next();
});

// Wrapper for async route handlers
const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

// Save staff allocations
router.post('/allocate', verifyToken, asyncHandler(async (req, res) => {
  console.log('[Timetable Route] Processing allocation request:', {
    body: req.body,
    user: req.user
  });
  await saveAllocations(req, res);
}));

// Generate timetable
router.post('/generate', verifyToken, asyncHandler(async (req, res) => {
  console.log('[Timetable Route] Processing timetable generation:', {
    body: req.body,
    timeConfig: req.body.timeConfig,
    semesterType: req.body.semesterType
  });
  await generateTimetable(req, res);
}));

// Get generated timetables
router.get('/generated', verifyToken, asyncHandler(async (req, res) => {
  console.log('[Timetable Route] Fetching generated timetables:', {
    query: req.query,
    user: req.user
  });
  await getGeneratedTimetables(req, res);
}));

// Get subjects for a department
router.get('/subjects', verifyToken, asyncHandler(async (req, res) => {
  console.log('[Timetable Route] Fetching subjects:', {
    query: req.query,
    user: req.user
  });
  await getSubjects(req, res);
}));

// Get staff for a department
router.get('/staff', verifyToken, asyncHandler(async (req, res) => {
  console.log('[Timetable Route] Fetching staff:', {
    query: req.query,
    user: req.user
  });
  await getStaff(req, res);
}));

export default router; 