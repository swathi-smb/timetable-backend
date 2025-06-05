import { DataTypes } from "sequelize";
import {sequelize} from "../config/db.js";
import School from "./School.js";
import Department from "./Department.js";

const Staff = sequelize.define("staff", {
  staff_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  staff_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'school_id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'departments',
      key: 'department_id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  email_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
}, {
  tableName: "staff",
  timestamps: false
});

// Define associations
Staff.belongsTo(School, {
  foreignKey: 'school_id',
  as: 'School'
});

Staff.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'Department'
});

export default Staff;
