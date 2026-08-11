import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

const PLACEHOLDER = /placeholder|your-project|your-anon-key|your-service-role-key/i;

const clean = (value: string | undefined) =>
  value && value.trim() && !PLACEHOLDER.test(value) ? value.trim() : "";

export const getSupabaseUrl = () => clean(process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Server-side key. Supabase's newer naming calls this a "secret key"
 * (sb_secret_...); older projects call it the service role key. Either one
 * bypasses RLS, which this app relies on — see getDatabaseStatus().
 */
export const getSupabaseSecretKey = () =>
  clean(process.env.SUPABASE_SECRET_KEY) || clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Browser-safe key: publishable (sb_publishable_...) or the legacy anon key. */
export const getSupabasePublishableKey = () =>
  clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export type DatabaseStatus =
  | { ok: true }
  | { ok: false; reason: "no-url" | "no-key" | "publishable-only"; message: string };

/**
 * This CRM has no Supabase Auth — it is PIN-gated and every query runs on the
 * server. schema.sql therefore enables RLS with no policies at all, so a
 * publishable/anon key can read and write nothing. A secret key is required;
 * accepting a publishable one would silently return empty results forever.
 */
export const getDatabaseStatus = (): DatabaseStatus => {
  if (!getSupabaseUrl()) {
    return {
      ok: false,
      reason: "no-url",
      message: "NEXT_PUBLIC_SUPABASE_URL is not set.",
    };
  }
  if (getSupabaseSecretKey()) return { ok: true };
  if (getSupabasePublishableKey()) {
    return {
      ok: false,
      reason: "publishable-only",
      message:
        "Only a publishable key is set. This app needs a secret key (SUPABASE_SECRET_KEY) " +
        "because row level security blocks all access without one.",
    };
  }
  return {
    ok: false,
    reason: "no-key",
    message: "SUPABASE_SECRET_KEY is not set.",
  };
};

export const isDatabaseConfigured = () => getDatabaseStatus().ok;

export const getSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey();

  if (!url || !key) {
    const status = getDatabaseStatus();
    throw new Error(status.ok ? "Supabase is misconfigured." : status.message);
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore when called from a Server Component.
        }
      },
    },
  });
};
