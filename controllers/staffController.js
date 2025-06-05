import db from "../config/db.js";
import Staff from "../models/Staff.js";

// Debugging helper function
const logDebug = (message, error = null) => {
  console.log(`[DEBUG]: ${message}`);
  if (error) console.error(`[ERROR]: ${error.message}`);
};

// ✅ Get all schools
export const getSchoolsController = async (req, res) => {
  try {
    logDebug("Fetching all schools");
    const [result] = await db.query("SELECT * FROM schools");
    res.json(result);
  } catch (error) {
    logDebug("Failed to fetch schools", error);
    res.status(500).json({ error: "Failed to fetch schools", details: error.message });
  }
};

// ✅ Get departments by school ID
export const getDepartmentsBySchoolController = async (req, res) => {
  try {
    let { school_id } = req.params;
    school_id = parseInt(school_id, 10);

    if (isNaN(school_id)) {
      return res.status(400).json({ error: "Invalid school_id" });
    }

    logDebug(`Fetching departments for school ID: ${school_id}`);

    const [result] = await db.query(
      "SELECT * FROM departments WHERE school_id = ?",
      [school_id]
    );

    res.json(result);
  } catch (error) {
    logDebug("Failed to fetch departments", error);
    res.status(500).json({ error: "Failed to fetch departments", details: error.message });
  }
};

// ✅ Get staff by school and department
export const getStaffBySchoolAndDepartmentController = async (req, res) => {
  try {
    const { school_id, department_id } = req.query;

    // Log the query parameters to ensure they are being passed correctly
    console.log("Received query parameters:", { school_id, department_id });

    if (!school_id || !department_id) {
      return res.status(400).json({ error: "School ID and Department ID are required" });
    }

    logDebug(`Fetching staff for School ID: ${school_id} and Department ID: ${department_id}`);

    const [result] = await db.query(`
      SELECT s.staff_id, s.staff_name AS name, s.specialization, s.email_id, 
             sc.school_id, sc.school_name, d.department_id, d.department_name
      FROM staff s
      JOIN schools sc ON s.school_id = sc.school_id
      JOIN departments d ON s.department_id = d.department_id
      WHERE s.school_id = ? AND s.department_id = ?
    `, [school_id, department_id]);

    res.json(result);
  } catch (error) {
    logDebug("Failed to fetch filtered staff", error);
    res.status(500).json({ error: "Failed to fetch filtered staff", details: error.message });
  }
};

// ✅ Get staff by ID
export const getStaffByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    logDebug(`Fetching staff with ID: ${id}`);
    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  } catch (error) {
    logDebug("Error fetching staff", error);
    res.status(500).json({ message: "Error fetching staff", error });
  }
};

// ✅ Create new staff
export const createStaffController = async (req, res) => {
  try {    const { staff_name, specialization, school_id, department_id, email_id } = req.body;
    
    if (!staff_name || !specialization || !school_id || !department_id || !email_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    logDebug(`Adding new staff: ${staff_name}, ${specialization}, School ID: ${school_id}, Department ID: ${department_id}, Email: ${email_id}`);

    const newStaff = await Staff.create({
      staff_name,
      specialization,
      school_id,
      department_id,
      email_id,
      is_active: true
    });
    
    res.status(201).json({ message: "Staff added successfully!", newStaff });
  } catch (error) {
    console.error("Error adding staff:", error); // ✅ Print full error message
    res.status(500).json({ message: "Error adding staff", error: error.message });
  }
};


// ✅ Update staff
export const updateStaffController = async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_name, specialization, school_id, department_id ,email_id} = req.body;

    logDebug(`Updating staff with ID: ${id}`);
    const staff = await Staff.findByPk(id);

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.staff_name = staff_name;
    staff.specialization = specialization;
    staff.school_id = school_id;
    staff.department_id = department_id;
    staff.email_id = email_id;
    await staff.save();

    res.json({ message: "Staff updated successfully", staff });
  } catch (error) {
    logDebug("Error updating staff", error);
    res.status(500).json({ message: "Error updating staff", error });
  }
};

// ✅ Delete staff
export const deleteStaffController = async (req, res) => {
  try {
    const { id } = req.params;
    logDebug(`Deleting staff with ID: ${id}`);
    const staff = await Staff.findByPk(id);

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    await staff.destroy();
    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    logDebug("Error deleting staff", error);
    res.status(500).json({ message: "Error deleting staff", error });
  }
};
