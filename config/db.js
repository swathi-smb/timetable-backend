import mysql from "mysql2";
import dotenv from "dotenv";
import { Sequelize } from 'sequelize';

dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false // Disable logging for cleaner console output
});

// Create MySQL pool for raw queries
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // Convert to promise-based pool

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Test pool connection
    const connection = await pool.getConnection();
    console.log("MySQL Pool Connected...");
    connection.release();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Export both sequelize and pool
export { sequelize, pool };
export default pool;
