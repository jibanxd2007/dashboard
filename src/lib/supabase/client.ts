import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createBrowserClient<Database>(url, key);
};
