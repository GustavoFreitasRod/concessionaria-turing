import 'dotenv/config'; 
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("A variável de ambiente DATABASE_URL não está definida. Verifique seu arquivo .env");
}

export const sql = neon(databaseUrl);