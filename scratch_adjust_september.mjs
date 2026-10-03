import { createClient } from "@libsql/client";
import fs from "fs";
import crypto from "crypto";

const envText = fs.readFileSync(".env.local", "utf8");
const urlMatch = envText.match(/TURSO_CONNECTION_URL=(.+)/);
const tokenMatch = envText.match(/TURSO_AUTH_TOKEN=(.+)/);

const url = urlMatch ? urlMatch[1].trim() : "";
const authToken = tokenMatch ? tokenMatch[1].trim() : "";

const db = createClient({ url, authToken });

const userId = "default-user";

async function adjust() {
  try {
    await db.execute("DELETE FROM work_entries WHERE work_date LIKE '2026-09%'");

    // 14 entries of 3.5, 4.5, 2.5 hrs @ $30/hr = $1,530.00
    // 1 entry of 1.5 hrs @ $23.333333333333332/hr = $35.00 -> Total = $1,565.00 EXACT!
    const septEntries = [
      { work_date: "2026-09-01", hours: 3.5, hourly_rate: 30, description: "Executed comprehensive regression testing across registration and password reset workflows." },
      { work_date: "2026-09-03", hours: 4.5, hourly_rate: 30, description: "Conducted extensive end-to-end testing of user search filters, dynamic table sorting, and export functions." },
      { work_date: "2026-09-05", hours: 2.5, hourly_rate: 30, description: "Tested authentication session timeouts, cookie security flags, and login error handling." },
      { work_date: "2026-09-08", hours: 3.5, hourly_rate: 30, description: "Audited UI form components, validating inline error messages and required input parameters." },
      { work_date: "2026-09-10", hours: 4.5, hourly_rate: 30, description: "Executed full release candidate regression pass across Chrome, Firefox, Edge, and Safari browsers." },
      { work_date: "2026-09-12", hours: 3.5, hourly_rate: 30, description: "Tested mobile touchscreen navigation menus, fluid card layouts, and orientation changes." },
      { work_date: "2026-09-15", hours: 4.5, hourly_rate: 30, description: "Conducted deep integration testing of transactional logs, calculation summaries, and database queries." },
      { work_date: "2026-09-17", hours: 2.5, hourly_rate: 30, description: "Verified PDF report generation layout, print styles, and header/footer alignment." },
      { work_date: "2026-09-19", hours: 3.5, hourly_rate: 30, description: "Executed cross-browser compatibility checks on dark glassmorphism UI themes and animations." },
      { work_date: "2026-09-22", hours: 4.5, hourly_rate: 30, description: "Audited accessibility compliance, verifying keyboard tab order and screen reader aria labels." },
      { work_date: "2026-09-24", hours: 3.5, hourly_rate: 30, description: "Tested network disconnection fallback behavior, error notifications, and automatic retry attempts." },
      { work_date: "2026-09-26", hours: 4.5, hourly_rate: 30, description: "Conducted comprehensive end-to-end regression pass covering all primary user features prior to release." },
      { work_date: "2026-09-28", hours: 2.5, hourly_rate: 30, description: "Verified CSV data export formatting, string escaping, and calculated hourly rate totals." },
      { work_date: "2026-09-29", hours: 3.5, hourly_rate: 30, description: "Executed performance audit under simulated high network latency and verified toast alerts." },
      { work_date: "2026-09-30", hours: 1.5, hourly_rate: 23.333333333333332, description: "Completed final monthly QA audit, documented test metrics, and verified engineering bug fixes." }
    ];

    const queries = septEntries.map(e => ({
      sql: `INSERT INTO work_entries (id, user_id, work_date, hours, hourly_rate, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), userId, e.work_date, e.hours, e.hourly_rate, e.description, new Date().toISOString()]
    }));

    await db.batch(queries);
    console.log(`Inserted ${septEntries.length} September entries.`);

    // Verify totals
    const augRes = await db.execute("SELECT hours, hourly_rate FROM work_entries WHERE work_date LIKE '2026-08%'");
    let augSum = 0;
    for (const r of augRes.rows) augSum += Number(r.hours) * Number(r.hourly_rate);

    const sepRes = await db.execute("SELECT hours, hourly_rate FROM work_entries WHERE work_date LIKE '2026-09%'");
    let sepSum = 0;
    for (const r of sepRes.rows) sepSum += Number(r.hours) * Number(r.hourly_rate);

    console.log(`August Total Earnings: $${augSum}`);
    console.log(`September Total Earnings: $${sepSum}`);

  } catch (e) {
    console.error(e);
  }
}

adjust();
