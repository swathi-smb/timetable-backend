module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('staff', 'email_id', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        after: 'department_id'
      });
      console.log('Added email_id column to staff table');
    } catch (error) {
      console.error('Error adding email_id column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('staff', 'email_id');
      console.log('Removed email_id column from staff table');
    } catch (error) {
      console.error('Error removing email_id column:', error);
      throw error;
    }
  }
};
