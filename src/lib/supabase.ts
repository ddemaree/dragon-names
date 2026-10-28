import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Uses the secret key, which bypasses RLS; never import this from client code
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false },
  });
}
