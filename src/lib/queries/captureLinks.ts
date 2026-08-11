import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb, CaptureLinkItem } from "@/lib/mockStore";
import { ContactSource } from "@/lib/database.types";

export async function getCaptureLinks(): Promise<CaptureLinkItem[]> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("capture_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data as CaptureLinkItem[];
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return [...mockDb.captureLinks];
}

export async function createCaptureLink(
  slugOrData: string | { slug: string; label: string; source?: ContactSource; campaign?: string | null },
  labelArg?: string,
  sourceArg: ContactSource = "instagram",
  campaignArg?: string
): Promise<CaptureLinkItem> {
  const slug = typeof slugOrData === "object" ? slugOrData.slug : slugOrData;
  const label = typeof slugOrData === "object" ? slugOrData.label : labelArg || "";
  const source = typeof slugOrData === "object" ? (slugOrData.source || "instagram") : sourceArg;
  const campaign = typeof slugOrData === "object" ? slugOrData.campaign : campaignArg;

  const now = new Date().toISOString();
  const id = "c_" + crypto.randomUUID();

  const newLink: CaptureLinkItem = {
    id,
    slug: slug.toLowerCase().trim(),
    label,
    source,
    campaign: campaign || null,
    created_at: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("capture_links")
        .insert(newLink as any)
        .select()
        .single();
      if (!error && data) return data as CaptureLinkItem;
    } catch (e) {
      console.warn("Supabase insert failed, falling back to mockDb:", e);
    }
  }

  mockDb.captureLinks.unshift(newLink);
  return newLink;
}

export async function getCaptureLinkBySlug(slug: string): Promise<CaptureLinkItem | null> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("capture_links")
        .select("*")
        .eq("slug", slug.toLowerCase().trim())
        .single();
      if (!error && data) return data as CaptureLinkItem;
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return mockDb.captureLinks.find((l: CaptureLinkItem) => l.slug.toLowerCase() === slug.toLowerCase()) || null;
}
