import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

// Connection test function
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`;
    return result[0]?.test === 1;
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for database connection diagnostics
    console.error('Database connection test failed:', error);
    return false;
  }
}
