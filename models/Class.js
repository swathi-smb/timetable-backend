import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Course from "./Course.js";

const Class = sequelize.define("Class", {
  class_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },  class_name: {
    type: DataTypes.STRING,
    allowNull: false,
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
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: "course_id",
    },
  },
  added_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  added_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  
}, {
  tableName: "classes",
  timestamps: false,
});

Course.hasMany(Class, { foreignKey: "course_id" });
Class.belongsTo(Course, { foreignKey: "course_id" });

export default Class;
