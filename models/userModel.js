import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import School from './School.js';
import Department from './Department.js';
import Course from './Course.js';

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  confirm_password_hash:{
    type: DataTypes.STRING,
    allowNull: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 2, 3]] // 1: admin, 2: staff, 3: student
    }
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'schools',
      key: 'school_id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'department_id'
    }
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'course_id'
    }
  },
  school_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  course_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role_number: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      // Custom validation to ensure role_number is provided only for students
      isValidRoleNumber(value) {
        if (this.role_id === 3 && !value) {
          throw new Error('Role number is required for students');
        }
      }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false, // Disable Sequelize's timestamp handling
  hooks: {
    beforeCreate: (user) => {
      user.created_at = new Date();
      user.updated_at = new Date();
    },
    beforeUpdate: (user) => {
      user.updated_at = new Date();
    }
  }
});

// Define associations
User.belongsTo(School, {
  foreignKey: 'school_id',
  as: 'School'
});

User.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'Department'
});

User.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'Course'
});

export default User;
