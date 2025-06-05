import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('timetables', 'semester', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 8
    }
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('timetables', 'semester');
};
