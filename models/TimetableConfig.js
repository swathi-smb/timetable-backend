// models/TimetableConfig.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const TimetableConfig = sequelize.define('TimetableConfig', {
  institution_id: DataTypes.INTEGER,
  day_start: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '09:00:00'
  },
  day_end: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '17:00:00'
  },
  lunch_start: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '13:00:00'
  },
  lunch_end: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '14:00:00'
  },
  working_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 7
    }
  }
}, {
  tableName: 'timetable_config',
  timestamps: true
});

export default TimetableConfig;
