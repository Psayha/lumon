import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveRoleFromSessions1763620076000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop role column from sessions table
    // Role is now determined dynamically from user_companies table
    await queryRunner.dropColumn('sessions', 'role');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add role column if migration is rolled back
    await queryRunner.addColumn(
      'sessions',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['owner', 'manager', 'viewer'],
        enumName: 'user_role',
        default: "'viewer'",
        isNullable: false,
      }),
    );
  }
}
