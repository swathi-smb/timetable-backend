import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('classes', 'semester', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 8
    }
  });

  // Update existing class names to extract semester numbers
  await queryInterface.sequelize.query(`
    UPDATE classes
    SET semester = CAST(SUBSTRING(class_name, 9) AS UNSIGNED)
    WHERE class_name LIKE 'Semester %';
  `);

  // Add unique constraint
  await queryInterface.addConstraint('classes', {
    fields: ['course_id', 'semester'],
    type: 'unique',
    name: 'unique_semester_per_course'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeConstraint('classes', 'unique_semester_per_course');
  await queryInterface.removeColumn('classes', 'semester');
};
