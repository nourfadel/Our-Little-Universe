"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const reason = error.message.toLowerCase();
    // Keep credentials out of logs; status/code are enough to diagnose auth setup issues.
    console.warn("[auth] Supabase sign-in failed", { status: error.status, code: error.code });
    if (reason.includes("email not confirmed")) {
      return { error: "This account's email is not confirmed. Check your inbox for the confirmation or invitation email and finish that step first." };
    }
    if (reason.includes("invalid api key") || reason.includes("no api key")) {
      return { error: "The app could not authenticate with Supabase. Check the project URL and publishable key in .env.local, then restart the app." };
    }
    if (error.status === 0 || reason.includes("fetch failed") || reason.includes("failed to fetch")) {
      return { error: "The app could not reach Supabase. Check your internet connection and the Supabase project URL in .env.local, then restart the app." };
    }
    return { error: "Supabase rejected the sign-in. Check the email and password. If you created this user with Send invitation, accept that email and set the password before signing in." };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
