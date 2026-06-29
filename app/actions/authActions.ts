"use server";

import { db } from "@/src/db/client";
import { initDb } from "@/src/db/schema";
import { hashPassword, comparePassword, createSession, destroySession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Please fill in all fields" };
  }

  try {
    await initDb();

    // Query database for user
    const res = await db.execute({
      sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
      args: [email.toLowerCase()],
    });

    if (res.rows.length === 0) {
      return { error: "Invalid email or password" };
    }

    const user = res.rows[0];
    const isMatch = await comparePassword(password, user.password_hash as string);

    if (!isMatch) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.id as string, user.email as string);
  } catch (error: any) {
    console.error("Login action error:", error);
    return { error: "Invalid credentials or database connection issue" };
  }

  redirect("/");
}

export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Please fill in all fields" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  try {
    await initDb();

    // Check if user exists
    const checkUser = await db.execute({
      sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
      args: [email.toLowerCase()],
    });

    if (checkUser.rows.length > 0) {
      return { error: "Email is already registered" };
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [id, email.toLowerCase(), passwordHash, createdAt],
    });

    await createSession(id, email.toLowerCase());
  } catch (error: any) {
    console.error("Signup action error:", error);
    return { error: "Failed to create account. Make sure database details are correct." };
  }

  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
