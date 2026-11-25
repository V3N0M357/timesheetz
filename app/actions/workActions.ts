"use server";

import { db } from "@/src/db/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { parseSchedulingRules, AutoFillRulesInput } from "@/src/lib/schedulingRules";

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

const SHORT_QA_PROMPTS = [
  "Tested navigation links, dropdown menus, and button click handlers",
  "Checked error toast messages and inline form validation feedback",
  "Verified placeholder text, icon alignment, and visual styling",
  "Retested single resolved UI ticket across Chrome viewport"
];

const MEDIUM_QA_PROMPTS = [
  "Executed cross-browser testing across desktop and tablet viewports",
  "Tested search bar queries, filter drop-downs, and table sorting behavior",
  "Validated authentication, session cookies, and login/logout flows",
  "Checked responsive layouts and container wrapping under window resizing"
];

const HEAVY_QA_PROMPTS = [
  "Conducted extensive end-to-end user journey testing across authentication, search, and checkout modules",
  "Executed comprehensive regression suite following major code refactor and verified all open engineering fixes",
  "Audited system for broken assets, multi-device layout bugs, and edge-case form submission errors",
  "Performed deep integration testing across user roles, data persistence, and API responses"
];

const FULL_DAY_QA_PROMPTS = [
  "Executed full production release candidate regression suite across 5 browser environments, validating performance and data integrity under high load",
  "Completed exhaustive system-wide QA session covering all primary user workflows, accessibility standards, and offline network fallback behavior",
  "Systematically audited entire platform architecture, documented reproduction steps for edge-case defects, and verified dev team fixes"
];

export async function generateAIDescriptionAction(
  pastDescriptions: string[] = [],
  customPrompt: string = "",
  hoursValInput?: number | string
) {
  try {
    const hoursNum = typeof hoursValInput === "number" ? hoursValInput : parseFloat(hoursValInput || "0");
    const hoursStr = !isNaN(hoursNum) && hoursNum > 0 ? `${hoursNum} hours` : "unspecified duration";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const sampleDescriptions = pastDescriptions.filter(Boolean).slice(0, 10).join("\n- ");
      
      let durationGuidance = "";
      if (hoursNum > 0) {
        if (hoursNum < 1.5) {
          durationGuidance = `Target session duration is SHORT (${hoursNum} hrs). Generate a targeted micro task (e.g. quick button check, single form field fix, menu link validation, or minor UI patch). Do NOT make it sound like an all-day massive audit.`;
        } else if (hoursNum <= 3.5) {
          durationGuidance = `Target session duration is MEDIUM (${hoursNum} hrs). Generate a moderate module check or suite run (e.g. testing cross-browser layout, validating search/filter functionality, or checking form suite validation).`;
        } else if (hoursNum <= 6.5) {
          durationGuidance = `Target session duration is MAJOR (${hoursNum} hrs). Generate a substantial, comprehensive work activity (e.g. full end-to-end user journey audits, multi-device regression passes, or complete issue reproduction and retesting across key components). NEVER suggest a trivial 10-minute task like "tested a menu".`;
        } else {
          durationGuidance = `Target session duration is FULL DAY / HEAVY (${hoursNum} hrs). Generate an exhaustive system-wide activity (e.g. full release candidate regression suite across 5+ browsers, complex performance & data integrity audit, or end-to-end integration testing across all primary user workflows). NEVER suggest a quick minor fix.`;
        }
      }

      const promptText = `You are an intelligent QA timesheet assistant.
Session Duration: ${hoursStr}.
${durationGuidance}

User's Custom AI Focus: ${customPrompt ? customPrompt : "Generate QA work activities appropriate for the session length."}

Past User Work Logs:
${sampleDescriptions ? `- ${sampleDescriptions}` : "- Tested user interface and API workflows"}

Generate ONE realistic, professional 1-sentence work entry description that matches the ${hoursStr} duration complexity.
Slightly alter wording each time so outputs are unique.
Do NOT include quotes, bullet points, or markdown. Return ONLY the description text.`;

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

    // Fallback logic when Gemini API key is offline/missing
    let pool = SHORT_QA_PROMPTS;
    if (hoursNum >= 6.5) {
      pool = FULL_DAY_QA_PROMPTS;
    } else if (hoursNum >= 4.0) {
      pool = HEAVY_QA_PROMPTS;
    } else if (hoursNum >= 1.5) {
      pool = MEDIUM_QA_PROMPTS;
    }

    let basePrompt = customPrompt.trim() || pool[Math.floor(Math.random() * pool.length)];

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
    return { description: "Executed end-to-end regression testing across core user workflows and verified system stability." };
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

export async function autoFillMonthAction(
  monthStr: string,
  targetEarnings: number,
  hourlyRateInput: number = 30,
  customPrompt: string = "",
  rulesInput?: AutoFillRulesInput | string
) {
  const userId = "default-user";
  if (!monthStr || !monthStr.includes("-")) {
    return { error: "Please select a valid month" };
  }
  if (isNaN(targetEarnings) || targetEarnings <= 0) {
    return { error: "Target earnings must be a positive dollar amount" };
  }
  const hourlyRate = isNaN(hourlyRateInput) || hourlyRateInput <= 0 ? 30 : hourlyRateInput;

  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  try {
    // 1. Parse natural language & structured scheduling rules
    const parsedRules = parseSchedulingRules(rulesInput);
    let effectivePrompt = customPrompt;

    // Optional AI enhancement if Gemini API key is present
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey && parsedRules.rulesText && parsedRules.rulesText.length > 5) {
      try {
        const promptText = `A user wants to auto-fill work timesheet hours with custom rules.
Rules: "${parsedRules.rulesText}"
Target Month: "${monthStr}"

Extract and return ONLY a JSON object:
{
  "allowedDays": [0, 6],
  "maxWeekendHours": 8,
  "maxWeekdayHours": 6,
  "generalMaxHours": 8,
  "minHours": 0.5,
  "workFocus": ""
}
Note: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. If user says "school on weekdays so only sat and sun" or "weekends only", return [0, 6]. If "weekdays only", return [1, 2, 3, 4, 5].
Do not include markdown or backticks, return only valid raw JSON.`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
            signal: AbortSignal.timeout(3500),
          }
        );
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text
            ?.replace(/```json/g, "")
            ?.replace(/```/g, "")
            ?.trim();
          if (rawText) {
            const parsedAI = JSON.parse(rawText);
            if (Array.isArray(parsedAI.allowedDays) && parsedAI.allowedDays.length > 0) {
              parsedRules.allowedDays = parsedAI.allowedDays;
            }
            if (typeof parsedAI.maxWeekendHours === "number" && parsedAI.maxWeekendHours > 0) {
              parsedRules.maxWeekendHours = parsedAI.maxWeekendHours;
            }
            if (typeof parsedAI.maxWeekdayHours === "number" && parsedAI.maxWeekdayHours > 0) {
              parsedRules.maxWeekdayHours = parsedAI.maxWeekdayHours;
            }
            if (typeof parsedAI.generalMaxHours === "number" && parsedAI.generalMaxHours > 0) {
              parsedRules.generalMaxHours = parsedAI.generalMaxHours;
            }
            if (typeof parsedAI.minHours === "number" && parsedAI.minHours > 0) {
              parsedRules.minHours = parsedAI.minHours;
            }
            if (parsedAI.workFocus && !customPrompt) {
              effectivePrompt = parsedAI.workFocus;
            }
          }
        }
      } catch (e) {
        // Fallback safely to deterministic parsedRules
      }
    }

    // 2. Find eligible days in the month matching allowedDays
    const daysInMonth = new Date(year, month, 0).getDate();
    const eligibleDates: Array<{
      date: string;
      dayOfWeek: number;
      isWeekend: boolean;
      maxHalfHours: number;
    }> = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      if (parsedRules.allowedDays.includes(dayOfWeek)) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (parsedRules.excludedDates && parsedRules.excludedDates.includes(dateStr)) {
          continue;
        }

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const maxHoursForDay = isWeekend ? parsedRules.maxWeekendHours : parsedRules.maxWeekdayHours;
        eligibleDates.push({
          date: dateStr,
          dayOfWeek,
          isWeekend,
          maxHalfHours: Math.max(1, Math.round(maxHoursForDay * 2)),
        });
      }
    }

    if (eligibleDates.length === 0) {
      const dayNames = parsedRules.allowedDays
        .map((d) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d])
        .join(", ");
      return {
        error: `No days matching rules (${dayNames}) were found in ${monthStr}. Please adjust allowed days.`,
      };
    }

    // 3. Convert target earnings into 0.5-hour blocks (each block = 0.5h)
    let targetHalfHours = Math.round((targetEarnings / hourlyRate) * 2);
    if (targetHalfHours < 1) targetHalfHours = 1;

    // Check capacity against user's max hour limits
    const totalCapacityHalfHours = eligibleDates.reduce((acc, d) => acc + d.maxHalfHours, 0);
    if (targetHalfHours > totalCapacityHalfHours) {
      const maxHours = totalCapacityHalfHours * 0.5;
      const maxEarnings = maxHours * hourlyRate;
      const ruleDaysLabel =
        parsedRules.allowedDays.length === 2 &&
        parsedRules.allowedDays.includes(0) &&
        parsedRules.allowedDays.includes(6)
          ? "Sat & Sun only (weekends)"
          : `${eligibleDates.length} eligible days`;
      return {
        error: `Target of $${targetEarnings} requires ${(targetHalfHours * 0.5).toFixed(1)}h, but with rules (${ruleDaysLabel}, capped at ${Math.max(parsedRules.maxWeekendHours, parsedRules.maxWeekdayHours)}h/day), the maximum possible is $${maxEarnings.toFixed(2)} (${maxHours.toFixed(1)}h). Please increase allowed days or reduce target earnings.`,
      };
    }

    // 4. Clear existing entries for that month
    await db.execute({
      sql: `DELETE FROM work_entries WHERE work_date LIKE ?`,
      args: [`${monthStr}%`],
    });

    // 5. Smart realistic distribution of sessions across eligible days
    const minHalfHours = Math.max(1, Math.round(parsedRules.minHours * 2));
    const maxDayCapacity = Math.max(...eligibleDates.map((d) => d.maxHalfHours));
    const minDaysNeeded = Math.ceil(targetHalfHours / maxDayCapacity);

    let chosenDays = [...eligibleDates];
    if (minDaysNeeded < eligibleDates.length && targetHalfHours / eligibleDates.length < minHalfHours) {
      const numDaysToPick = Math.max(minDaysNeeded, Math.floor(targetHalfHours / minHalfHours));
      const step = eligibleDates.length / numDaysToPick;
      chosenDays = [];
      for (let i = 0; i < numDaysToPick; i++) {
        chosenDays.push(eligibleDates[Math.floor(i * step)]);
      }
    }

    // Initialize chosen days with base hours
    const allocation = chosenDays.map((d) => ({ ...d, halfHours: minHalfHours }));
    let remainingHalfHours = targetHalfHours - minHalfHours * chosenDays.length;

    // Distribute remaining half hours randomly within individual day caps
    while (remainingHalfHours > 0) {
      const available = allocation.filter((d) => d.halfHours < d.maxHalfHours);
      if (available.length === 0) break;
      const pick = available[Math.floor(Math.random() * available.length)];
      const stepToAdd = Math.min(
        remainingHalfHours,
        pick.maxHalfHours - pick.halfHours,
        Math.random() > 0.45 ? 2 : 1
      );
      pick.halfHours += stepToAdd;
      remainingHalfHours -= stepToAdd;
    }

    // Format final sessions
    const sessions = allocation
      .filter((d) => d.halfHours > 0)
      .map((d) => ({
        date: d.date,
        hours: d.halfHours * 0.5,
        rate: hourlyRate,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Generate AI descriptions matching each session's exact hours
    const pastDescs = sessions.map((s) => `Session ${s.hours} hours`);
    const generatedEntries = [];
    const batchQueries = [];

    // Parallel description generation
    const descPromises = sessions.map((s) =>
      generateAIDescriptionAction(pastDescs, effectivePrompt, s.hours)
    );
    const descResults = await Promise.all(descPromises);

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const description =
        descResults[i]?.description ||
        `Executed ${s.hours} hours of QA testing, responsive verification, and bug triage.`;

      generatedEntries.push({
        id,
        user_id: userId,
        work_date: s.date,
        hours: s.hours,
        hourly_rate: s.rate,
        description,
        created_at: createdAt,
      });

      batchQueries.push({
        sql: `INSERT INTO work_entries (id, user_id, work_date, hours, hourly_rate, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, userId, s.date, s.hours, s.rate, description, createdAt],
      });
    }

    if (batchQueries.length > 0) {
      await db.batch(batchQueries);
    }

    revalidatePath("/");
    return { success: true, entries: generatedEntries, rulesApplied: parsedRules };
  } catch (err: any) {
    console.error("Auto-fill month error:", err);
    return { error: "Failed to auto-fill month. " + (err?.message || "") };
  }
}
