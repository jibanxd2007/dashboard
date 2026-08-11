import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

/**
 * Browser client. Not currently used — this CRM is PIN-gated and every query
 * runs on the server through lib/queries, which is why RLS has no policies.
 * Kept for future browser-side reads, which would require RLS policies first.
 */
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return createBrowserClient<Database>(url, key);
};
