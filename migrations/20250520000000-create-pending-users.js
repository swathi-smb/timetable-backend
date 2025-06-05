export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('PendingUsers', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false
    },
    school_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    department_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    specialization: {
      type: Sequelize.STRING,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW')
    }
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('PendingUsers');
};
