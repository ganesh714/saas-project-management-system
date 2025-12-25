require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/config/logger');
const { seedData } = require('./src/services/seederService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Authenticate DB
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // 2. Sync Models (Automatic Migrations)
    // In production, 'alter: true' matches schema to model definitions
    // NOTE: This fulfills "Automatic Initialization" requirement.
    await sequelize.sync({ alter: true });
    logger.info('Database Schema Synced.');

    // 3. Run Master Seeder
    await seedData();
    logger.info('Database Seeding Check Completed.');

    // 4. Start Server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
