import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const PendingUser = sequelize.define('pending_users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role_number: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  timestamps: true,
  underscored: true, // Use snake_case instead of camelCase
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default PendingUser;
