import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Runs an operation against Supabase when a database is configured.
 *
 * Returns `{ handled: false }` only when there is NO database at all, letting
 * the caller use the in-memory store for local UI work. When a database *is*
 * configured, failures throw instead of falling back — quietly writing a real
 * client record to memory would report success and then lose it on the next
 * restart, which is worse than an error the user can see.
 */
export async function withDb<T>(
  op: (supabase: any) => Promise<{ data: T | null; error: any }>
): Promise<{ handled: boolean; data: T | null }> {
  if (!isDatabaseConfigured()) return { handled: false, data: null };

  const supabase = await getSupabaseServerClient();
  const { data, error } = await op(supabase);

  if (error) {
    throw new DatabaseError(error.message || "Database request failed");
  }
  return { handled: true, data };
}
