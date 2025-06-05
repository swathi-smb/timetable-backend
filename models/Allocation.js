import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Subject from "./Subject.js";
import Staff from "./Staff.js";
import Course from "./Course.js";

const Allocation = sequelize.define(
  "allocation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'schools',
        key: "school_id",
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: "department_id",
      }
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: "course_id",
      }
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Subject,
        key: "subject_id",
      },
      onDelete: "CASCADE",
    },
    subject_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Staff,
        key: "staff_id",
      },
      onDelete: "CASCADE",
    },
    staff_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    theory_credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lab_credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    time_config: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    }
  },
  {
    tableName: "allocations",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  }
);

// Define associations
Allocation.belongsTo(Subject, { foreignKey: "subject_id" });
Allocation.belongsTo(Staff, { foreignKey: "staff_id" });
Allocation.belongsTo(Course, { foreignKey: "course_id" });

export default Allocation;