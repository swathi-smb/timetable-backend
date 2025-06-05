import express from "express";
import School from "../models/School.js";
import Department from "../models/Department.js";
import Course from "../models/Course.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import db from "../config/db.js";
const router = express.Router();

/* ==============================
   SCHOOL ROUTES
   ============================== */

// Get all schools
router.get("/", async (req, res) => {
  try {
    const schools = await School.findAll();
    res.status(200).json(schools);
  }
  catch (err) {
    console.error("Error fetching schools:", err);
    res.status(500).json({ error: "Failed to fetch schools", details: err.message });
  }
});

// Create a new school
router.post("/", async (req, res) => {
  try {
    const { schoolName, addedBy } = req.body;
    if (!schoolName || !schoolName.trim()) {
      return res.status(400).json({ error: "School name is required" });
    }

    const school = await School.create({
      school_name: schoolName.trim(),
      added_by: addedBy || null,
    });

    res.status(201).json({ message: "School added successfully", school });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to add school", details: err.message });
  }
});

// Edit a school
router.put("/:schoolId", async (req, res) => {
  try {
    const { schoolName } = req.body;
    const { schoolId } = req.params;

    await School.update(
      { school_name: schoolName },
      { where: { school_id: schoolId } }
    );

    res.status(200).json({ message: "School updated successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to update school", details: err.message });
  }
});

// Delete a school (Only deletes if no departments exist)
router.delete("/:schoolId", async (req, res) => {
  try {
    const { schoolId } = req.params;
    //check if the school has departments
    const departmentCount = await Department.count({ where: { school_id: schoolId } });

    if (departmentCount > 0) {
      return res.status(400).json({ error: "Cannot delete school with existing departments" });
    }

    //delete school
    await School.destroy({ where: { school_id: schoolId } });

    // Reset the auto-increment for department IDs
    await db.query("ALTER TABLE departments AUTO_INCREMENT = 1");

    res.status(200).json({ message: "School deleted successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to delete school", details: err.message });
  }
});

/* ==============================
   DEPARTMENT ROUTES
   ============================== */
// Create a department
router.post("/:schoolId/departments", async (req, res) => {
  try {
    const { departmentName, addedBy } = req.body;
    const { schoolId } = req.params;

    const department = await Department.create({
      department_name: departmentName,
      school_id: schoolId,
      added_by: addedBy || null,
    });

    res.status(201).json({ message: "Department added successfully", department });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to add department", details: err.message });
  }
});

// Get all departments for a specific school
router.get("/:schoolId/departments", async (req, res) => {
  try {
    const { schoolId } = req.params;
    const departments = await Department.findAll({ where: { school_id: schoolId } });
    res.status(200).json(departments);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Failed to fetch departments", details: err.message });
  }
});
//get all courses
router.get("/:schoolId/departments/:departmentId/courses", async (req, res) => {
  try {
    const { departmentId } = req.params;
    const courses = await Course.findAll({ where: { department_id: departmentId } });
    res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Failed to fetch courses", details: err.message });
  }
});

//delete department

router.delete("/:schoolId/departments/:departmentId", async (req, res) => {
  try {
    const { departmentId } = req.params;
    //check if department has courses
    const courseCount = await Course.count({ where: { department_id: departmentId } });
    if (courseCount > 0) {
      return res.status(400).json({ error: "Cannot delete department with existing courses" });
    }

    await Department.destroy({ where: { department_id: departmentId } });

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).json({ error: "Failed to delete department", details: err.message });
  }
});


/* ==============================
   COURSE ROUTES
   ============================== */
// Create a course
router.post("/:schoolId/departments/:departmentId/courses", async (req, res) => {
  try {
    const { course_name, addedBy } = req.body;
    const { departmentId, schoolId } = req.params;

    const course = await Course.create({
      course_name,
      school_id: schoolId,
      department_id: departmentId,
      added_by: addedBy || null,
    });

    res.status(201).json({ message: "Course added successfully", course });
  } catch (err) {
    console.error("Error adding course:", err.message); // Log the error message for better debugging

    res.status(500).json({ error: "Failed to add course", details: err.message });
  }
});

// Delete a course (Only deletes if no classes exist)
router.delete("/:schoolId/departments/:departmentId/courses/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const classCount = await Class.count({ where: { course_id: courseId } });

    if (classCount > 0) {
      return res.status(400).json({ error: "Cannot delete course with existing classes" });
    }

    await Course.destroy({ where: { course_id: courseId } });

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course", details: err.message });
  }
});

/* ==============================
   CLASS ROUTES
   ============================== */
// Create a class
router.post("/:schoolId/departments/:departmentId/courses/:courseId/classes", async (req, res) => {
  try {
    const { semester, addedBy } = req.body;
    const { courseId } = req.params;

    // Parse semester as integer
    const semesterNum = parseInt(semester, 10);

    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      return res.status(400).json({ error: "Valid semester number (1-8) is required" });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if a class with this semester already exists for this course
    const existingClass = await Class.findOne({ 
      where: { 
        course_id: courseId,
        semester: semesterNum,
        is_active: true
      }
    });

    if (existingClass) {
      return res.status(400).json({ error: "A class for this semester already exists in this course" });
    }

    const className = `Semester ${semesterNum}`;

    const classEntry = await Class.create({
      class_name: className,
      semester: semesterNum,
      course_id: courseId,
      added_by: addedBy || null,
      is_active: true
    });

    res.status(201).json({ message: "Class added successfully", classEntry });    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err.name === 'SequelizeUniqueConstraintError' 
        ? "A class for this semester already exists in this course"
        : "Failed to add class";
      res.status(err.name === 'SequelizeUniqueConstraintError' ? 400 : 500)
        .json({ error: errorMessage, details: err.message });
    }
});
// fetch all classes
router.get("/:schoolId/departments/:departmentId/courses/:courseId/classes", async (req, res) => {
  try {
    const { courseId } = req.params;
    const classes = await Class.findAll({ where: { course_id: courseId } });
    res.status(200).json({ classes });
  } catch (err) {
    console.error("Error fetching classes :", err);
    res.status(500).json({ error: "Failed to fetch classes", details: err.message });
  }
});

// Delete a class
router.delete("/:schoolId/departments/:departmentId/courses/:courseId/classes/:classId", async (req, res) => {
  try {
    const { classId } = req.params;

    await Class.destroy({ where: { class_id: classId } });

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to delete class", details: err.message });
  }
});

/* ==============================
   Section ROUTES
   ============================== */
// section a class
router.post("/:schoolId/departments/:departmentId/courses/:courseId/classes/:classId/sections", async (req, res) => {
  try {
    const { sectionName, addedBy } = req.body; // Fixing variable name case
    const { classId } = req.params;

    if (!sectionName.trim()) {
      return res.status(400).json({ error: "Section name cannot be empty" });
    }

    const sectionEntry = await Section.create({
      section_name: sectionName.trim(), // Ensure trimming to avoid whitespace issues
      class_id: classId,
      added_by: addedBy || null,
    });

    res.status(201).json({ message: "Section added successfully", sectionEntry });
  } catch (err) {
    console.error("Error adding section:", err);
    res.status(500).json({ error: "Failed to add section", details: err.message });
  }
});

//fetch all section
router.get("/:schoolId/departments/:departmentId/courses/:courseId/classes/:classId/sections", async (req, res) => {
  try {
    const { classId } = req.params;
    const sections = await Section.findAll({ where: { class_id: classId } });
    res.status(200).json({ sections });
  } catch (err) {
    console.error("Error fetching sections :", err);
    res.status(500).json({ error: "Failed to fetch sections", details: err.message });
  }
});
//delete section 
router.delete("/:schoolId/departments/:departmentId/courses/:courseId/classes/:classId/sections/:sectionId", async (req, res) => {
  try {
    const { sectionId } = req.params;

    const deletedSection = await Section.destroy({ where: { section_id: sectionId } });

    if (!deletedSection) {
      return res.status(404).json({ error: "Section not found" });
    }

    res.status(200).json({ message: "Section deleted successfully" });
  } catch (err) {
    console.error("Error deleting section:", err);
    res.status(500).json({ error: "Failed to delete section", details: err.message });
  }
});


// Export the router
export default router;
