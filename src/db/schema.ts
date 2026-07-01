import { db } from './client';

export async function initDb() {
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Create work_entries table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS work_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        work_date TEXT NOT NULL,
        hours REAL NOT NULL,
        hourly_rate REAL NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index on users email
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
    `);

    // Create index on work_entries user_id
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_work_entries_user_id ON work_entries (user_id)
    `);

    // Ensure default-user exists in the users table to prevent FOREIGN KEY constraint failures
    await db.execute({
      sql: "INSERT OR IGNORE INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: ["default-user", "default@example.com", "not-needed", new Date().toISOString()],
    });

    console.log('Database tables verified/initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
}
