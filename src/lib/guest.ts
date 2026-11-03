import "server-only";
import { createClient } from "@supabase/supabase-js";

// The guest school is a separate Riverbay for public visitors (see supabase/migrations/202611030001_guest_school.sql).
export const staffSchool = "00000000-0000-4000-8000-000000000001";
export const guestSchool = "00000000-0000-4000-8000-000000000002";

/** Guest sign-in appears only when the server holds the shared guest account's details. */
export function guestAccount() {
  const email = process.env.GUEST_EMAIL?.trim().toLowerCase(), password = process.env.GUEST_PASSWORD;
  return email && password ? { email, password } : null;
}

/** Server-only client that bypasses row-level security, for the guest school's setup and nightly reset. */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
