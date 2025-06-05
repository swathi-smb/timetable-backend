import express from "express";
import {
  getSchools,
  getDepartmentsBySchool,
  getCoursesByDepartment,
  getClassesByCourse,
  getSectionsByClass,
  AddSubject,
  getSubjects,
  updateSubject,
  deleteSubject,

} from "../controllers/subjectController.js";

const router = express.Router();

router.get("/schools", getSchools);
router.get("/departments/:schoolId", getDepartmentsBySchool);
router.get("/courses/:department_id", getCoursesByDepartment);
router.get("/classes/:course_id", getClassesByCourse);
router.get("/sections/:class_id", getSectionsByClass);
router.post("/subjects", AddSubject);
router.get("/subjects", getSubjects);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

export default router;
