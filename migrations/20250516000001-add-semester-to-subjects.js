import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('subjects', 'semester', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 8
    }
  });

  // Add index for faster querying
  await queryInterface.addIndex('subjects', ['course_id', 'semester'], {
    name: 'subjects_course_semester_idx'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('subjects', 'subjects_course_semester_idx');
  await queryInterface.removeColumn('subjects', 'semester');
};
