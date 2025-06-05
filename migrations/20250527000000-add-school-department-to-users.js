export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'school_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'schools',
      key: 'school_id'
    }
  });

  await queryInterface.addColumn('users', 'department_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'department_id'
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('users', 'school_id');
  await queryInterface.removeColumn('users', 'department_id');
}
