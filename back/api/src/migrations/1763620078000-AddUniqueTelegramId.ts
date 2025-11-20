import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SECURITY FIX: Add UNIQUE constraint to telegram_id
 *
 * VULNERABILITY (CVSS 9.0):
 * telegram_id is marked as unique: true in user.entity.ts
 * but without migrations, this constraint was never created in the database!
 *
 * This allows:
 * - Multiple user accounts for the same Telegram user
 * - Account hijacking and impersonation
 * - Data integrity violations
 *
 * FIX:
 * Adds UNIQUE constraint to telegram_id column in users table
 * Prevents duplicate Telegram accounts
 */
export class AddUniqueTelegramId1763620078000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // SECURITY: Check for existing duplicates before adding constraint
    const duplicates = await queryRunner.query(`
      SELECT telegram_id, COUNT(*) as count
      FROM users
      WHERE telegram_id IS NOT NULL
      GROUP BY telegram_id
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      console.warn(
        `⚠️  WARNING: Found ${duplicates.length} duplicate telegram_id values!`,
      );
      console.warn('Duplicates:', duplicates);
      console.warn(
        'Please resolve duplicates before applying this migration.',
      );
      console.warn(
        'You can keep the most recent user and delete/merge others.',
      );

      throw new Error(
        'Cannot add UNIQUE constraint: duplicate telegram_id values exist. ' +
        'Please clean up data first.',
      );
    }

    // SECURITY FIX: Add UNIQUE constraint to telegram_id
    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT UQ_users_telegram_id
      UNIQUE (telegram_id)
    `);

    console.log('✅ UNIQUE constraint added to users.telegram_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove UNIQUE constraint
    await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS UQ_users_telegram_id
    `);

    console.log('❌ UNIQUE constraint removed from users.telegram_id');
  }
}
