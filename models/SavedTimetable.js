import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Course from "./Course.js";
import Department from "./department.js";
import School from "./School.js";
import User from "./userModel.js";

const SavedTimetable = sequelize.define(
  "saved_timetable",
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
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

export default SavedTimetable; 