import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Department from "./Department.js";
import School from "./School.js";

const Course = sequelize.define("Course", {
  course_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  course_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: School,
      key: "school_id",
    },
    onDelete: 'CASCADE'
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Department,
      key: "department_id",
    },
    onDelete: 'CASCADE'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },
  added_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  added_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  modified_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  modified_date: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: "courses",
  timestamps: false,
  hooks: {
    beforeUpdate: (instance) => {
      instance.modified_date = new Date();
    }
  }
});

Department.hasMany(Course, { foreignKey: "department_id" });
Course.belongsTo(Department, { foreignKey: "department_id" });

School.hasMany(Course, { foreignKey: "school_id" });
Course.belongsTo(School, { foreignKey: "school_id" });

export default Course;
