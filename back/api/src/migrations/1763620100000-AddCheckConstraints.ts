import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SECURITY: Add CHECK constraints to prevent negative values
 *
 * Enforces data integrity at the database level:
 * - limit_value must be >= 0
 * - current_usage must be >= 0
 * - request_count must be >= 0
 * - file_size must be >= 0
 *
 * This prevents:
 * - Negative limits (business logic violation)
 * - Negative usage counts (data corruption)
 * - Integer underflow attacks
 */
export class AddCheckConstraints1763620100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // User Limits: limit_value and current_usage must be non-negative
    await queryRunner.query(`
      ALTER TABLE user_limits
      ADD CONSTRAINT CHK_user_limits_limit_value_nonnegative
      CHECK (limit_value >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE user_limits
      ADD CONSTRAINT CHK_user_limits_current_usage_nonnegative
      CHECK (current_usage >= 0)
    `);

    // Rate Limits: request_count must be non-negative
    await queryRunner.query(`
      ALTER TABLE rate_limits
      ADD CONSTRAINT CHK_rate_limits_request_count_nonnegative
      CHECK (request_count >= 0)
    `);

    // Backups: file_size must be non-negative (if exists)
    const backupsTableExists = await queryRunner.hasTable('backups');
    if (backupsTableExists) {
      const fileSizeColumn = await queryRunner.hasColumn('backups', 'file_size');
      if (fileSizeColumn) {
        await queryRunner.query(`
          ALTER TABLE backups
          ADD CONSTRAINT CHK_backups_file_size_nonnegative
          CHECK (file_size >= 0)
        `);
      }
    }

    // Platform Stats: all numeric metrics must be non-negative (if exists)
    const statsTableExists = await queryRunner.hasTable('platform_stats');
    if (statsTableExists) {
      await queryRunner.query(`
        ALTER TABLE platform_stats
        ADD CONSTRAINT CHK_platform_stats_total_users_nonnegative
        CHECK (total_users >= 0)
      `);

      await queryRunner.query(`
        ALTER TABLE platform_stats
        ADD CONSTRAINT CHK_platform_stats_active_users_nonnegative
        CHECK (active_users >= 0)
      `);

      await queryRunner.query(`
        ALTER TABLE platform_stats
        ADD CONSTRAINT CHK_platform_stats_total_chats_nonnegative
        CHECK (total_chats >= 0)
      `);

      await queryRunner.query(`
        ALTER TABLE platform_stats
        ADD CONSTRAINT CHK_platform_stats_total_messages_nonnegative
        CHECK (total_messages >= 0)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove CHECK constraints in reverse order
    const statsTableExists = await queryRunner.hasTable('platform_stats');
    if (statsTableExists) {
      await queryRunner.query(`
        ALTER TABLE platform_stats DROP CONSTRAINT IF EXISTS CHK_platform_stats_total_messages_nonnegative
      `);

      await queryRunner.query(`
        ALTER TABLE platform_stats DROP CONSTRAINT IF EXISTS CHK_platform_stats_total_chats_nonnegative
      `);

      await queryRunner.query(`
        ALTER TABLE platform_stats DROP CONSTRAINT IF EXISTS CHK_platform_stats_active_users_nonnegative
      `);

      await queryRunner.query(`
        ALTER TABLE platform_stats DROP CONSTRAINT IF EXISTS CHK_platform_stats_total_users_nonnegative
      `);
    }

    const backupsTableExists = await queryRunner.hasTable('backups');
    if (backupsTableExists) {
      await queryRunner.query(`
        ALTER TABLE backups DROP CONSTRAINT IF EXISTS CHK_backups_file_size_nonnegative
      `);
    }

    await queryRunner.query(`
      ALTER TABLE rate_limits DROP CONSTRAINT IF EXISTS CHK_rate_limits_request_count_nonnegative
    `);

    await queryRunner.query(`
      ALTER TABLE user_limits DROP CONSTRAINT IF EXISTS CHK_user_limits_current_usage_nonnegative
    `);

    await queryRunner.query(`
      ALTER TABLE user_limits DROP CONSTRAINT IF EXISTS CHK_user_limits_limit_value_nonnegative
    `);
  }
}
