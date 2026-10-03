import { createClient } from "@libsql/client";
import fs from "fs";

const envText = fs.readFileSync(".env.local", "utf8");
const urlMatch = envText.match(/TURSO_CONNECTION_URL=(.+)/);
const tokenMatch = envText.match(/TURSO_AUTH_TOKEN=(.+)/);

const url = urlMatch ? urlMatch[1].trim() : "";
const authToken = tokenMatch ? tokenMatch[1].trim() : "";

const db = createClient({ url, authToken });

async function checkMonths() {
  try {
    const augRes = await db.execute("SELECT id, work_date, hours, hourly_rate, description FROM work_entries WHERE work_date LIKE '2026-08%' ORDER BY work_date ASC");
    let augTotal = 0;
    console.log(`August: ${augRes.rows.length} entries`);
    for (const r of augRes.rows) {
      augTotal += Number(r.hours) * Number(r.hourly_rate);
    }
    console.log(`August Total: $${augTotal}`);

    const sepRes = await db.execute("SELECT id, work_date, hours, hourly_rate, description FROM work_entries WHERE work_date LIKE '2026-09%' ORDER BY work_date ASC");
    let sepTotal = 0;
    console.log(`September: ${sepRes.rows.length} entries`);
    for (const r of sepRes.rows) {
      sepTotal += Number(r.hours) * Number(r.hourly_rate);
    }
    console.log(`September Total: $${sepTotal}`);
  } catch (e) {
    console.error(e);
  }
}

checkMonths();
