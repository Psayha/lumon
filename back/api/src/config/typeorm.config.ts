import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { entities } from '../entities';

config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'lumon',
  entities,
  synchronize: false, // NEVER use synchronize in production!
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(typeOrmConfig);
