// models/GeneratedTimetable.js
import { DataTypes } from 'sequelize';
import {sequelize} from '../config/db.js';
import School from './School.js';
import Department from './Department.js';

const GeneratedTimetable = sequelize.define('GeneratedTimetable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: School,
      key: 'school_id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  academic_year: {
    type: DataTypes.STRING(9),
    allowNull: false,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  config: {
    type: DataTypes.JSON,
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
  }
}, {
  tableName: "generated_timetables",
  timestamps: false,
});

School.hasMany(GeneratedTimetable, { foreignKey: 'school_id' });
GeneratedTimetable.belongsTo(School, { foreignKey: 'school_id' });

Department.hasMany(GeneratedTimetable, { foreignKey: 'department_id' });
GeneratedTimetable.belongsTo(Department, { foreignKey: 'department_id' });

export default GeneratedTimetable;
