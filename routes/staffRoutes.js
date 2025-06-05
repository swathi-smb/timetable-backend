import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getStaffBySchoolAndDepartmentController,
  getStaffByIdController,
  createStaffController,
  updateStaffController,
  deleteStaffController,
  getSchoolsController,
  getDepartmentsBySchoolController
} from "../controllers/staffController.js";

const router = express.Router();

// ✅ Get all schools
router.get("/schools", verifyToken, getSchoolsController);

// ✅ Get departments by school ID
router.get("/departments/:school_id", verifyToken, getDepartmentsBySchoolController);

// ✅ Get all staff
router.get("/", verifyToken,getStaffBySchoolAndDepartmentController);

// ✅ Get staff by ID
router.get("/:id", verifyToken, getStaffByIdController);

// ✅ Add new staff
router.post("/", verifyToken, createStaffController);

// ✅ Update staff
// router.put("/:id", verifyToken, updateStaffController);

// ✅ Delete staff
router.delete("/:id", verifyToken, deleteStaffController);

export default router;
