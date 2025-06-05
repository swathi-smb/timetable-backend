import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE timetables MODIFY COLUMN slot_type ENUM('theory', 'lab', 'free', 'lunch', 'minor', 'ge')`
  );
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE timetables MODIFY COLUMN slot_type ENUM('theory', 'lab', 'free')`
  );
};
