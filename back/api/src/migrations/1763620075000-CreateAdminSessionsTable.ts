import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAdminSessionsTable1763620075000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admin_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'admin_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'session_token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'admin_username',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_activity_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create index on session_token for fast lookups
    await queryRunner.createIndex(
      'admin_sessions',
      new TableIndex({
        name: 'IDX_admin_sessions_session_token',
        columnNames: ['session_token'],
      }),
    );

    // Create index on expires_at for cleanup queries
    await queryRunner.createIndex(
      'admin_sessions',
      new TableIndex({
        name: 'IDX_admin_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admin_sessions');
  }
}
