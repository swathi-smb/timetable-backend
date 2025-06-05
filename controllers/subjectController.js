import db from "../config/db.js";
import Department from "../models/department.js";
import Course from "../models/Course.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import Subject from "../models/Subject.js";
import { Op } from "sequelize";
import Staff from "../models/Staff.js";
import { pool } from "../config/db.js";

// Fetch Schools
export const getSchools = async (req, res) => {
  try {
    console.log("Fetching schools...");
    const [rows] = await pool.query("SELECT * FROM schools WHERE is_active = 1");
    console.log("Schools fetched:", rows);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({ 
      message: "Error fetching schools", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Fetch Departments based on School ID
export const getDepartmentsBySchool = async (req, res) => {
  try {
    console.log("Received params:", req.params);  // Log incoming params

    const schoolId = req.params.schoolId; // Extract school_id correctly
    console.log("Extracted schoolId:", schoolId); // Log the extracted ID

    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }

    console.log(`Executing SQL Query: SELECT * FROM departments WHERE school_id = ${schoolId}`);

    // Use Sequelize's findAll() method instead of raw query
    const departments = await Department.findAll({
      where: { school_id: schoolId }
    });

    if (!departments || departments.length === 0) {
      console.log(`No departments found for school_id = ${schoolId}`);
      return res.status(404).json({ message: "No departments found" });
    }

    console.log("Fetched departments:", departments);
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch Courses based on Department ID
export const getCoursesByDepartment = async (req, res) => {
  try {
    console.log("Received params:", req.params);  // Debugging
    const department_id = req.params.department_id;
    if (!department_id) {
      return res.status(400).json({ message: "Department ID is required" });
    }
    const courses = await Course.findAll({
      where: { department_id: department_id }
    });
    if (!courses || courses.length === 0) {
      console.log(`No courses found for department_id = ${department_id}`);
      return res.status(404).json({ message: "No courses found" });
    }
    console.log("Fetched courses:", courses);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch Classes based on Course ID
export const getClassesByCourse = async (req, res) => {
  try {
    console.log("Recieved params:", req.params);
    const course_id = req.params.course_id;
    if (!course_id) {
      return res.status(400).json({ message: "Course ID is required" });
    }    const classes = await Class.findAll({
      where: { course_id: course_id },
      order: [['semester', 'ASC']] // Order by semester
    });
    if (!classes || classes.length === 0) {
      console.log(`No classes found for course_id = ${course_id}`);
      return res.status(404).json({ message: "No classes found" });
    }
    console.log("Fetched classes:", classes);
    res.json({ classes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes", error });
  }
};

// Fetch Sections based on Class ID
export const getSectionsByClass = async (req, res) => {
  try {
    console.log("Received params:", req.params);
    const class_id = req.params.class_id;
    if (!class_id) {
      return res.status(400).json({ message: "Class ID is required" });
    }
    const [sections] = await Section.findAll({
      where: { class_id: class_id }
    });
    console.log("Fetched sections:", sections);
    if (!sections || sections.length === 0) {
      console.log(`No sections found for class_id = ${class_id}`);
      return res.status(404).json({ message: "No sections found" });
    }
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sections", error });
  }
};

// **Add Subject**
export const AddSubject = async (req, res) => {
  try {    const { subject_name, course_id, semester, sub_type, subject_category, theory_credits, lab_credits, added_by } = req.body;

    // Validate required fields
    if (!course_id || !sub_type || !subject_category || !semester) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }
    // Validate semester
    if (semester < 1 || semester > 8) {
      return res.status(400).json({ error: "Semester must be between 1 and 8" });
    }
    // Only validate subject_name if not GE
    if (subject_category !== "General Elective(GE)" && !subject_name) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Convert to numbers
    const theoryCredits = Number(theory_credits) || 0;
    const labCredits = Number(lab_credits) || 0;

    // Validate credits based on subject type
    if (sub_type.toLowerCase() === 'both') {
      if (labCredits >= theoryCredits) {
        return res.status(400).json({
          error: "For 'Both' type subjects, lab credits must be less than theory credits"
        });
      }
      if (theoryCredits <= 0 || labCredits <= 0) {
        return res.status(400).json({
          error: "Both theory and lab credits must be positive numbers"
        });
      }
    } else if (sub_type.toLowerCase() === 'theory') {
      if (theoryCredits <= 0) {
        return res.status(400).json({
          error: "Theory credits must be a positive number"
        });
      }
    } else if (sub_type.toLowerCase() === 'lab') {
      if (labCredits <= 0) {
        return res.status(400).json({
          error: "Lab credits must be a positive number"
        });
      }
    }    // Create the subject
    const newSubject = await Subject.create({
      subject_name,
      course_id,
      semester,
      sub_type,
      subject_category,
      theory_credits: theoryCredits,
      lab_credits: labCredits,
      added_by
    });

    res.status(201).json({
      message: "Subject added successfully",
      subject: newSubject
    });

  } catch (error) {
    console.error("Error adding subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// **Update Subject** - Updated to handle GE subjects
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject_name,
      sub_type,
      subject_category,
      theory_creditSections,
      lab_credits,
      modified_by
    } = req.body;

    console.log("✅ Received Data for Update:", req.body);

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Convert credits to numbers
    const theoryCredits = Number(theory_creditSections) || 0;
    const labCredits = Number(lab_credits) || 0;

    console.log("✅ Processed Credits:", { theoryCredits, labCredits });

    await subject.update({
      subject_name: subject_name || subject.subject_name,
      sub_type: sub_type || subject.sub_type,
      subject_category: subject_category || subject.subject_category,
      theory_credits: theoryCredits,  // Make sure this is included!
      lab_credits: labCredits,
      modified_by: modified_by || subject.modified_by,
      modified_date: new Date()
    });

    res.status(200).json({ message: "Subject updated successfully", subject });
  } catch (error) {
    console.error("❌ Update Error:", error);
    res.status(500).json({ error: "Database error, subject not updated." });
  }
};

// **Delete Subject**
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑 Deleting Subject with ID: ${id}`);

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    await subject.destroy();
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("❌ Deletion Error:", error);
    res.status(500).json({ error: "Database error, subject not deleted." });
  }
};

// **Get All Subjects**
export const getSubjects = async (req, res) => {
  try {
    const { school_id, department_id, course_id, class_id } = req.query;
    console.log("Received query params:", { school_id, department_id, course_id, class_id });

    if (!school_id || !department_id) {
      return res.status(400).json({ error: "School ID and Department ID are required" });
    }

    // Get class details if class_id is provided to get semester
    let semester;
    if (class_id) {
      const classDetails = await Class.findByPk(class_id);
      if (classDetails) {
        semester = classDetails.semester;
      }
    }

    // Build subject query criteria
    const whereClause = {
      is_active: true,
    };

    if (course_id) {
      whereClause.course_id = course_id;
    }

    if (semester) {
      whereClause.semester = semester;
    }

    // Then get all subjects based on filters
    const subjects = await Subject.findAll({
      where: whereClause,
      include: [
        { 
          model: Course,
          where: { 
            school_id,
            department_id,
            is_active: true 
          },
          required: true
        }
      ],
      order: [
        ['subject_name', 'ASC']
      ]
    });

    console.log(`Found ${subjects.length} subjects for filters:`, whereClause);
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ 
      error: "Error fetching subjects",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

