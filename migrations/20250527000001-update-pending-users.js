'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add additional columns to pending_users if not already exists
    const pendingUsersTable = await queryInterface.describeTable('pending_users');
    
    const changes = [];
    
    if (!pendingUsersTable.specialization) {
      changes.push(
        queryInterface.addColumn('pending_users', 'specialization', {
          type: Sequelize.STRING,
          allowNull: true
        })
      );
    }

    if (!pendingUsersTable.role_number) {
      changes.push(
        queryInterface.addColumn('pending_users', 'role_number', {
          type: Sequelize.STRING,
          allowNull: true
        })
      );
    }

    return Promise.all(changes);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('pending_users', 'specialization'),
      queryInterface.removeColumn('pending_users', 'role_number')
    ]);
  }
};
