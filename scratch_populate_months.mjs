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

const newAugustEntries = [
  { work_date: "2026-08-08", hours: 3.5, hourly_rate: 30, description: "Executed comprehensive cross-browser pass across Chrome and Safari, verifying search bar queries and filter drop-down behavior." },
  { work_date: "2026-08-14", hours: 4.5, hourly_rate: 30, description: "Conducted extensive end-to-end user journey testing across authentication, profile management, and dashboard statistics." },
  { work_date: "2026-08-20", hours: 2.5, hourly_rate: 30, description: "Audited UI responsiveness across tablet and mobile viewports, resolving container wrapping issues." },
  { work_date: "2026-08-25", hours: 4.0, hourly_rate: 30, description: "Executed full regression test suite following major UI updates and verified resolved engineering tickets." }
];

const newSeptemberEntries = [
  { work_date: "2026-09-02", hours: 3.5, hourly_rate: 30, description: "Executed comprehensive regression testing across registration and password reset workflows." },
  { work_date: "2026-09-04", hours: 4.5, hourly_rate: 30, description: "Conducted extensive end-to-end testing of user search filters, dynamic table sorting, and export functions." },
  { work_date: "2026-09-07", hours: 2.5, hourly_rate: 30, description: "Tested authentication session timeouts, cookie security flags, and login error handling." },
  { work_date: "2026-09-09", hours: 3.5, hourly_rate: 30, description: "Audited UI form components, validating inline error messages and required input parameters." },
  { work_date: "2026-09-11", hours: 4.5, hourly_rate: 30, description: "Executed full release candidate regression pass across Chrome, Firefox, Edge, and Safari browsers." },
  { work_date: "2026-09-14", hours: 3.5, hourly_rate: 30, description: "Tested mobile touchscreen navigation menus, fluid card layouts, and orientation changes." },
  { work_date: "2026-09-16", hours: 4.5, hourly_rate: 30, description: "Conducted deep integration testing of transactional logs, calculation summaries, and database queries." },
  { work_date: "2026-09-18", hours: 2.5, hourly_rate: 30, description: "Verified PDF report generation layout, print styles, and header/footer alignment." },
  { work_date: "2026-09-21", hours: 3.5, hourly_rate: 30, description: "Executed cross-browser compatibility checks on dark glassmorphism UI themes and animations." },
  { work_date: "2026-09-23", hours: 4.5, hourly_rate: 30, description: "Audited accessibility compliance, verifying keyboard tab order and screen reader aria labels." },
  { work_date: "2026-09-25", hours: 3.5, hourly_rate: 30, description: "Tested network disconnection fallback behavior, error notifications, and automatic retry attempts." },
  { work_date: "2026-09-28", hours: 4.5, hourly_rate: 30, description: "Conducted comprehensive end-to-end regression pass covering all primary user features prior to release." },
  { work_date: "2026-09-29", hours: 2.5, hourly_rate: 30, description: "Verified CSV data export formatting, string escaping, and calculated hourly rate totals." },
  { work_date: "2026-09-30", hours: 2.0, hourly_rate: 30, description: "Completed final monthly QA audit, documented test metrics, and verified engineering bug fixes." }
];

async function populate() {
  try {
    const allToAdd = [...newAugustEntries, ...newSeptemberEntries];
    const queries = allToAdd.map(e => ({
      sql: `INSERT INTO work_entries (id, user_id, work_date, hours, hourly_rate, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), userId, e.work_date, e.hours, e.hourly_rate, e.description, new Date().toISOString()]
    }));

    await db.batch(queries);
    console.log(`Successfully inserted ${allToAdd.length} entries!`);

    // Verify totals
    const augRes = await db.execute("SELECT hours, hourly_rate FROM work_entries WHERE work_date LIKE '2026-08%'");
    let augSum = 0;
    for (const r of augRes.rows) augSum += Number(r.hours) * Number(r.hourly_rate);

    const sepRes = await db.execute("SELECT hours, hourly_rate FROM work_entries WHERE work_date LIKE '2026-09%'");
    let sepSum = 0;
    for (const r of sepRes.rows) sepSum += Number(r.hours) * Number(r.hourly_rate);

    console.log(`NEW August Total: $${augSum}`);
    console.log(`NEW September Total: $${sepSum}`);
  } catch (e) {
    console.error("Populate error:", e);
  }
}

populate();
