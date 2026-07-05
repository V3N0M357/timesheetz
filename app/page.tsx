import { db } from "@/src/db/client";
import { initDb } from "@/src/db/schema";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  // Ensure DB schema initialized (idempotent)
  try {
    await initDb();
  } catch (err) {
    console.error("DB initialization error on page load:", err);
  }

  // Fetch all entries in the database (regardless of user_id, so old logged logs show up)
  let entries: any[] = [];
  try {
    const result = await db.execute("SELECT * FROM work_entries ORDER BY work_date DESC, created_at DESC");
    
    entries = result.rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      work_date: row.work_date as string,
      hours: Number(row.hours),
      hourly_rate: Number(row.hourly_rate),
      description: row.description as string,
      created_at: row.created_at as string,
    }));
  } catch (err) {
    console.error("Failed to query entries:", err);
  }

  return <DashboardClient initialEntries={entries} />;
}
