"use server";

import { db } from "@/src/db/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function addWorkEntryAction(prevState: any, formData: FormData) {
  const userId = "default-user";

  const workDate = formData.get("work_date")?.toString();
  const hoursStr = formData.get("hours")?.toString();
  const hourlyRateStr = formData.get("hourly_rate")?.toString();
  const description = formData.get("description")?.toString().trim();

  if (!workDate || !hoursStr || !hourlyRateStr || !description) {
    return { error: "Please fill in all fields" };
  }

  const hours = parseFloat(hoursStr);
  const hourlyRate = parseFloat(hourlyRateStr);

  if (isNaN(hours) || hours <= 0) {
    return { error: "Hours worked must be a positive number" };
  }

  if (isNaN(hourlyRate) || hourlyRate < 0) {
    return { error: "Hourly rate must be a valid number" };
  }

  try {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO work_entries (id, user_id, work_date, hours, hourly_rate, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, userId, workDate, hours, hourlyRate, description, createdAt],
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Add work entry error:", error);
    return { error: "Failed to save work entry. Verify database connection." };
  }
}

export async function updateWorkEntryAction(id: string, formData: FormData) {
  const userId = "default-user";

  const workDate = formData.get("work_date")?.toString();
  const hoursStr = formData.get("hours")?.toString();
  const hourlyRateStr = formData.get("hourly_rate")?.toString();
  const description = formData.get("description")?.toString().trim();

  if (!workDate || !hoursStr || !hourlyRateStr || !description) {
    return { error: "Please fill in all fields" };
  }

  const hours = parseFloat(hoursStr);
  const hourlyRate = parseFloat(hourlyRateStr);

  if (isNaN(hours) || hours <= 0) {
    return { error: "Hours worked must be a positive number" };
  }

  if (isNaN(hourlyRate) || hourlyRate < 0) {
    return { error: "Hourly rate must be a valid number" };
  }

  try {
    await db.execute({
      sql: `
        UPDATE work_entries 
        SET work_date = ?, hours = ?, hourly_rate = ?, description = ?
        WHERE id = ?
      `,
      args: [workDate, hours, hourlyRate, description, id],
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update work entry error:", error);
    return { error: "Failed to update work entry. Verify database connection." };
  }
}

export async function deleteWorkEntryAction(id: string) {
  try {
    await db.execute({
      sql: "DELETE FROM work_entries WHERE id = ?",
      args: [id],
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete work entry error:", error);
    return { error: "Failed to delete work entry." };
  }
}

export async function addMultipleWorkEntriesAction(entries: { work_date: string; hours: number; hourly_rate: number; description: string }[]) {
  const userId = "default-user";

  if (!Array.isArray(entries) || entries.length === 0) {
    return { error: "No entries provided" };
  }

  try {
    const queries = entries.map((entry) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      return {
        sql: `
          INSERT INTO work_entries (id, user_id, work_date, hours, hourly_rate, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [id, userId, entry.work_date, entry.hours, entry.hourly_rate, entry.description, createdAt],
      };
    });

    await db.batch(queries);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Batch add work entries error:", error);
    return { error: "Failed to save multiple work entries. Verify database connection." };
  }
}
