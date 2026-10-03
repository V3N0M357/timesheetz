"use server";

import { db } from "@/src/db/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const QA_PROMPT_BANK = [
  // Functionality testing
  "Tested navigation links and buttons across all primary site views",
  "Tested common user workflows from start to finish to ensure smooth end-to-end user journeys",
  "Tested forms with valid and invalid information to verify client and server validation handling",
  "Checked error messages and confirmation messages for clarity and accuracy",
  "Verified search, filtering, and sorting features across historical dataset",
  "Tested login, logout, registration, and password-reset functions",
  "Checked downloads, videos, and embedded media content rendering",
  "Retested open issues after they were marked as resolved by engineering",

  // Browser and device testing
  "Tested the application across Chrome, Safari, Firefox, and Edge browsers",
  "Tested site layout and responsiveness on desktop, tablet, and mobile screen sizes",
  "Checked screen layouts in both portrait and landscape orientation",
  "Resized the browser window dynamically and checked fluid container layouts",
  "Tested navigation menus, buttons, and input forms on touchscreen mobile devices",
  "Checked page performance and fallback behavior with slow or spotty network connections",

  // Visual and content review
  "Inspected site assets for broken, missing, stretched, or blurry image rendering",
  "Checked UI layout for overlapping, cut-off, or misaligned visual components",
  "Audited visual styles for inconsistent fonts, colors, spacing, and button variants",
  "Proofread all visible interface text for spelling and grammatical consistency",
  "Audited interface for placeholder text, outdated labels, or duplicate content",
  "Verified contact information, billing dates, prices, and displayed numerical totals",

  // Usability and accessibility
  "Observed users completing key tasks and recorded usability friction points",
  "Verified whether each section and screen clearly communicates its core purpose",
  "Tested keyboard navigation using Tab and Enter keys without a mouse",
  "Checked page usability, container wrapping, and text clarity at increased zoom levels",
  "Verified that all form fields, labels, instructions, and inline errors are clear and accessible",

  // Bug reporting and project support
  "Documented bug reports, verified reproduction steps, and supported dev team fixes"
];

const VARIATION_PREFIXES = [
  "Thoroughly ",
  "Executed comprehensive pass: ",
  "Validated and ",
  "Completed QA session: ",
  "Systematically ",
  "Audited & ",
  "Performed detailed check: ",
  "Finished regression run: "
];

const VARIATION_SUFFIXES = [
  " for production release.",
  " across desktop and mobile viewports.",
  " under high-concurrency loads.",
  " following recent UI updates.",
  " in dark glass theme mode.",
  " prior to staging deployment.",
  " with edge-case test datasets.",
  " and updated testing documentation."
];

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
    return { 
      success: true, 
      entry: { 
        id, 
        user_id: userId, 
        work_date: workDate, 
        hours, 
        hourly_rate: hourlyRate, 
        description, 
        created_at: createdAt 
      } 
    };
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
    const createdEntries: any[] = [];
    const queries = entries.map((entry) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      createdEntries.push({
        id,
        user_id: userId,
        work_date: entry.work_date,
        hours: entry.hours,
        hourly_rate: entry.hourly_rate,
        description: entry.description,
        created_at: createdAt
      });
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
    return { success: true, entries: createdEntries };
  } catch (error: any) {
    console.error("Batch add work entries error:", error);
    return { error: "Failed to save multiple work entries. Verify database connection." };
  }
}

export async function generateAIDescriptionAction(pastDescriptions: string[] = [], customPrompt: string = "") {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const sampleDescriptions = pastDescriptions.filter(Boolean).slice(0, 10).join("\n- ");
      const promptText = `You are an AI assistant generating QA timesheet descriptions.
User's Custom AI Prompt/Focus: ${customPrompt ? customPrompt : "Generate QA testing tasks matching user's work"}
Past User Work Logs:
${sampleDescriptions ? `- ${sampleDescriptions}` : "- Tested user interface and API workflows"}

Base QA Tasks Pool:
${QA_PROMPT_BANK.slice(0, 10).map(t => `- ${t}`).join("\n")}

Generate ONE unique, professional 1-sentence work entry description.
Each time you generate, slightly alter the wording, focus, or phrasing so no two outputs are identical.
Do NOT include quotes, bullet points, or extra formatting. Return ONLY the description text.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return { description: text.replace(/^["']|["']$/g, '') };
        }
      }
    }

    let basePrompt = "";
    if (customPrompt.trim()) {
      basePrompt = customPrompt.trim();
    } else {
      const randomIndex = Math.floor(Math.random() * QA_PROMPT_BANK.length);
      basePrompt = QA_PROMPT_BANK[randomIndex];
    }

    const prefix = VARIATION_PREFIXES[Math.floor(Math.random() * VARIATION_PREFIXES.length)];
    const suffix = VARIATION_SUFFIXES[Math.floor(Math.random() * VARIATION_SUFFIXES.length)];

    let altered = basePrompt.charAt(0).toLowerCase() + basePrompt.slice(1);
    if (prefix.endsWith(": ")) {
      altered = prefix + basePrompt + suffix;
    } else {
      altered = prefix + altered + suffix;
    }

    altered = altered.replace(/\.\./g, '.');
    return { description: altered };

  } catch (err) {
    console.error("AI Description error:", err);
    return { description: "Thoroughly tested navigation links and buttons across desktop and mobile viewports." };
  }
}

export async function refineAllDescriptionsAction(entries: { id: string; description: string }[]) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { error: "No entries available to refine." };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const refinedMap: Record<string, string> = {};

    if (apiKey) {
      const itemsText = entries.map((e) => `[ID:${e.id}] ${e.description}`).join("\n");
      const promptText = `You are a professional technical editor and copywriter.
Below is a list of work log descriptions. Refine each one into clean, professional, grammatically correct English.
Fix all typos, spelling errors, missing capitalizations, bad grammar, and missing punctuation (ensure proper sentence ending with period).
Keep the original technical meaning intact.

IMPORTANT: Return each result strictly on a separate line formatted as:
[ID:exact_id] Refined description sentence.

List to refine:
${itemsText}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const lines = outputText.split("\n");
        for (const line of lines) {
          const match = line.match(/^\[ID:(.+?)\]\s*(.+)$/);
          if (match) {
            const id = match[1].trim();
            const text = match[2].trim();
            if (id && text) {
              refinedMap[id] = text;
            }
          }
        }
      }
    }

    const spellFixes: Record<string, string> = {
      "develope": "develop",
      "developed": "Developed",
      "devlopment": "development",
      "immediete": "immediate",
      "asthetic": "aesthetic",
      "reincorperation": "re-incorporation",
      "compltely": "completely",
      "stabalizes": "stabilizes",
      "enbters": "enters",
      "grammer": "grammar",
      "capatlizations": "capitalizations",
      "diofferent": "different",
      "ctn": "CTN",
      "api": "API",
      "css": "CSS",
      "java": "Java",
      "javascript": "JavaScript",
      "ui": "UI"
    };

    const updatedEntries: { id: string; description: string }[] = [];
    const batchQueries = [];

    for (const entry of entries) {
      let newDesc = refinedMap[entry.id];
      if (!newDesc) {
        let text = entry.description.trim();
        for (const [wrong, right] of Object.entries(spellFixes)) {
          const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
          text = text.replace(regex, right);
        }
        if (text.length > 0) {
          text = text.charAt(0).toUpperCase() + text.slice(1);
        }
        if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
          text += '.';
        }
        newDesc = text;
      }

      updatedEntries.push({ id: entry.id, description: newDesc });

      batchQueries.push({
        sql: "UPDATE work_entries SET description = ? WHERE id = ?",
        args: [newDesc, entry.id]
      });
    }

    if (batchQueries.length > 0) {
      await db.batch(batchQueries);
    }

    revalidatePath("/");
    return { success: true, updatedEntries };

  } catch (err: any) {
    console.error("Refine descriptions error:", err);
    return { error: "Failed to refine descriptions. " + (err?.message || "") };
  }
}
