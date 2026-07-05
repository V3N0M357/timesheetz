const { createClient } = require('@libsql/client');

const url = "libsql://timesheetz-vercel-icfg-eyqyqdnzicbgud43pm5jzgiz.aws-us-west-2.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODI3Nzc1NjgsImlkIjoiMDE5ZjE1ZDItZGEwMS03NWI4LTg2N2QtMjhjMTU1MGI3NjcxIiwia2lkIjoiNURxSGlyMk1hQU5ERkJWZjFyZkpnZ29tbTJGMWd4Ukp3djc2ZjhySThLUSIsInJpZCI6IjgzNWFiZmIwLTc1YWEtNGNlZC05YmRmLTFiZDJiNGVhYTZkOCJ9.IVevHSRxsfa9MxsL5O11jy0B1W4Py32gPen4u1mRPKFoaQjh8aEw7425Ljk6nprVvFrtIj54qQf4jL6afiy9Aw";

console.log("Checking database schema...");
const db = createClient({ url, authToken });

async function run() {
  try {
    const users = await db.execute("SELECT * FROM users");
    console.log("Users:", users.rows);
    const entries = await db.execute("SELECT * FROM work_entries");
    console.log("Work Entries:", entries.rows);
  } catch (err) {
    console.error("Database query failed:", err);
  }
}

run();
