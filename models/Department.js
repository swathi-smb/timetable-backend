import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Department = sequelize.define('department', {
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  department_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "departments",
  timestamps: false,
});

export default Department;
