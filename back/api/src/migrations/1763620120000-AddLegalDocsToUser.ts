import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLegalDocsToUser1763620120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'legal_accepted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'legal_version',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'legal_version');
    await queryRunner.dropColumn('users', 'legal_accepted_at');
  }
}
