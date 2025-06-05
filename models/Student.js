import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import School from './School.js';
import Department from './department.js';
import Course from './Course.js';

const Student = sequelize.define('Student', {
  student_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roll_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  school_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'schools',
      key: 'school_id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departments',
      key: 'department_id'
    }
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'course_id'
    }
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  added_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  modified_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  added_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  modified_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false, // Disable Sequelize's default timestamps
  tableName: 'students' // Explicitly set the table name
});

// Define associations
Student.belongsTo(School, { foreignKey: 'school_id' });
Student.belongsTo(Department, { foreignKey: 'department_id' });
Student.belongsTo(Course, { foreignKey: 'course_id' });

export default Student;