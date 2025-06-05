import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Course from "./Course.js"; 
import Section from "./Section.js";
import Staff from "./Staff.js";

const Subject = sequelize.define(
  "subject",
  {
    subject_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subject_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: "course_id",
      },
      onDelete: "CASCADE",
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
        isValid(value) {
          if (value < 1 || value > 8) {
            throw new Error('Semester must be between 1 and 8');
          }
        }
      }
    },
    section_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: Section,
        key: "section_id",
      },
      onDelete: "CASCADE",
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'staff',
        key: 'staff_id'
      }
    },
    sub_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    subject_category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    theory_credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10
      }
    },
    lab_credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10
      }
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
    }
  },
  {
    tableName: "subjects",
    timestamps: false,
  }
);

// Define associations
Course.hasMany(Subject, { foreignKey: "course_id" });
Subject.belongsTo(Course, { foreignKey: "course_id" });

Section.hasMany(Subject, { foreignKey: "section_id" });
Subject.belongsTo(Section, { foreignKey: "section_id" });

Staff.hasMany(Subject, { foreignKey: "staff_id" });
Subject.belongsTo(Staff, { foreignKey: "staff_id" });

Subject.associate = function(models) {
  Subject.belongsTo(models.Staff, {
    foreignKey: 'staff_id',
    as: 'Staff'
  });
};

export default Subject;
