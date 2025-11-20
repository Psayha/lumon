import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

/**
 * SECURITY: Create login_attempts table to track failed login attempts
 * Prevents brute force attacks by locking accounts after too many failures
 */
export class CreateLoginAttemptsTable1763620077000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'login_attempts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'identifier',
            type: 'varchar',
            length: '255',
            comment: 'Username, email, or IP address',
          },
          {
            name: 'identifier_type',
            type: 'varchar',
            length: '50',
            comment: 'Type: username, email, or ip',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'IP address of the failed attempt',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User agent of the failed attempt',
          },
          {
            name: 'is_locked',
            type: 'boolean',
            default: false,
            comment: 'Whether this attempt is part of an active lockout',
          },
          {
            name: 'locked_until',
            type: 'timestamp',
            isNullable: true,
            comment: 'When the lockout expires (null if not locked)',
          },
          {
            name: 'attempt_count',
            type: 'int',
            default: 1,
            comment: 'Number of consecutive failed attempts',
          },
          {
            name: 'attempt_time',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'When the attempt occurred',
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient lookups
    await queryRunner.createIndex(
      'login_attempts',
      new Index({
        name: 'IDX_login_attempts_identifier',
        columnNames: ['identifier'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new Index({
        name: 'IDX_login_attempts_identifier_time',
        columnNames: ['identifier', 'attempt_time'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new Index({
        name: 'IDX_login_attempts_locked',
        columnNames: ['is_locked', 'locked_until'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('login_attempts');
  }
}
