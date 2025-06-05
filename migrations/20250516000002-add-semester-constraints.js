import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // First, remove any existing constraint (in case it exists)
  try {
    await queryInterface.removeConstraint('classes', 'unique_semester_per_course');
  } catch (err) {
    // Ignore if constraint doesn't exist
  }

  // Add the unique constraint
  await queryInterface.addConstraint('classes', {
    fields: ['course_id', 'semester'],
    type: 'unique',
    name: 'unique_semester_per_course'
  });

  // Add an index for performance
  await queryInterface.addIndex('classes', {
    fields: ['course_id', 'semester'],
    name: 'idx_classes_course_semester'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('classes', 'idx_classes_course_semester');
  await queryInterface.removeConstraint('classes', 'unique_semester_per_course');
};
