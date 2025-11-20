import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { Logger } from '@nestjs/common';

/**
 * SECURITY: Automatic Migration Runner
 *
 * Runs database migrations automatically on application startup.
 * This ensures:
 * - UNIQUE constraints are created (telegram_id)
 * - CHECK constraints are created (non-negative values)
 * - All schema changes are applied
 * - Database is always in sync with code
 */
export async function runMigrations(): Promise<void> {
  const logger = new Logger('MigrationRunner');

  try {
    logger.log('🔄 Initializing database connection for migrations...');

    // Create a temporary data source for running migrations
    const dataSource = new DataSource(typeOrmConfig);

    await dataSource.initialize();
    logger.log('✅ Database connection established');

    // Check for pending migrations
    const pendingMigrations = await dataSource.showMigrations();

    if (pendingMigrations) {
      logger.log('📋 Pending migrations detected. Running migrations...');

      // Run all pending migrations
      await dataSource.runMigrations({
        transaction: 'all', // Run all migrations in a single transaction
      });

      logger.log('✅ All migrations completed successfully');
    } else {
      logger.log('✅ Database schema is up to date. No migrations needed.');
    }

    // Close the connection
    await dataSource.destroy();
    logger.log('🔒 Migration connection closed');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    // In production, we want to fail fast if migrations fail
    // This prevents running with an outdated schema
    if (process.env.NODE_ENV === 'production') {
      logger.error('🚨 CRITICAL: Cannot start application without migrations!');
      process.exit(1);
    } else {
      logger.warn('⚠️  Development mode: Continuing despite migration errors');
      logger.warn('⚠️  Run: npm run migration:run');
    }
  }
}
