// models/TableData.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Subject from "./Subject.js"; // Import the Subject model

const TableData = sequelize.define('TableData', {
  day: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  period: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  staff_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'tabledata',
});

// Define the relationship with Subject (to fetch theory and lab credits)
TableData.belongsTo(Subject, {
  foreignKey: 'subject', // subject refers to subject_name in TableData
  targetKey: 'subject_name',
  as: 'subjectDetails', // Alias for easy access
});

// Export the model
export default TableData;
