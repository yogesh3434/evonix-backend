import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

/**
 * TypeORM database connection.
 *
 * DIRECT_URL is preferred for TypeORM because migrations and schema operations
 * work better through Supabase session-mode pooler.
 *
 * DATABASE_URL can be used later for normal runtime pooled connections.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/entities/**/*.{js,ts}'],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  ssl: {
    rejectUnauthorized: false,
  },
});
