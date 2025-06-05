import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Course from "./Course.js";
import Class from "./Class.js";
import Subject from "./Subject.js";
import Staff from "./Staff.js";

const Timetable = sequelize.define(
  "timetable",
  {
    timetable_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      allowNull: true,
      references: {
        model: Course,
        key: "course_id",
      },
      onDelete: "CASCADE",
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Class,
        key: "class_id",
      },
      onDelete: "CASCADE",
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Subject,
        key: "subject_id",
      },
      onDelete: "CASCADE",
    },
    subject_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Staff,
        key: "staff_id",
      },
      onDelete: "SET NULL",
    },
    staff_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    academic_year: {
      type: DataTypes.STRING(9),
      allowNull: true,
      validate: {
        is: /^\d{4}-\d{4}$/,
      },
    },
    day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 6, // 0-6 for Monday-Sunday
      },
    },
    start_time: {
      type: DataTypes.STRING(5), // Format: "HH:MM"
      allowNull: false,
    },
    end_time: {
      type: DataTypes.STRING(5), // Format: "HH:MM"
      allowNull: false,
    },
    slot_type: {
      type: DataTypes.ENUM("theory", "lab", "free", "lunch", "minor", "ge"),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    added_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    added_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    modified_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 8,
      },
    },
  },
  {
    tableName: "timetables",
    timestamps: false,
  }
);

// Define associations
Course.hasMany(Timetable, { foreignKey: "course_id" });
Timetable.belongsTo(Course, { foreignKey: "course_id" });

Class.hasMany(Timetable, { foreignKey: "class_id" });
Timetable.belongsTo(Class, { foreignKey: "class_id" });

Subject.hasMany(Timetable, { foreignKey: "subject_id" });
Timetable.belongsTo(Subject, { foreignKey: "subject_id" });

Staff.hasMany(Timetable, { foreignKey: "staff_id" });
Timetable.belongsTo(Staff, { foreignKey: "staff_id" });

export default Timetable;