import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Course from "./Course.js";
import Department from "./Department.js";
import School from "./School.js";
import User from "./userModel.js";

const SavedTimetable = sequelize.define(
  "saved_timetables",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timetable_data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: "course_id",
      },
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Department,
        key: "department_id",
      },
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: School,
        key: "school_id",
      },
    },
    course_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    }
    // 🚫 Do NOT declare created_at or updated_at here
  },
  {
    tableName: 'saved_timetables',
    timestamps: true, // Sequelize will automatically manage created_at and updated_at
    underscored: true, // This ensures it uses snake_case fields like created_at
  }
);


export default SavedTimetable; 