import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { entities } from '../entities';

config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'lumon',
  entities,
  // FIX: Use compiled .js files in production, .ts files in development
  migrations: process.env.NODE_ENV === 'production'
    ? ['dist/migrations/**/*.js']
    : ['src/migrations/**/*.ts'],
  migrationsRun: false, // Don't auto-run migrations, run them manually
  synchronize: false, // NEVER use synchronize in production!
  logging: process.env.NODE_ENV === 'development',
  // SECURITY FIX: Enable proper SSL verification
  ssl: process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.DB_SSL_CA || undefined,
      }
    : false,
};

export const AppDataSource = new DataSource(typeOrmConfig);
