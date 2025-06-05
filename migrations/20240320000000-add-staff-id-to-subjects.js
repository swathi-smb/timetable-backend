export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('subjects', 'staff_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'staff',
      key: 'staff_id'
    },
    onDelete: 'SET NULL'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('subjects', 'staff_id');
} 