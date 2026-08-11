import { mockDb, CaptureLinkItem } from "@/lib/mockStore";
import { ContactSource } from "@/lib/database.types";
import { withDb } from "@/lib/queries/db";

export async function getCaptureLinks(): Promise<CaptureLinkItem[]> {
  const { handled, data } = await withDb<CaptureLinkItem[]>((s) =>
    s.from("capture_links").select("*").order("created_at", { ascending: false })
  );
  if (handled) return data ?? [];
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
  const source = typeof slugOrData === "object" ? slugOrData.source || "instagram" : sourceArg;
  const campaign = typeof slugOrData === "object" ? slugOrData.campaign : campaignArg;

  const newLink: CaptureLinkItem = {
    id: crypto.randomUUID(),
    slug: slug.toLowerCase().trim(),
    label,
    source,
    campaign: campaign || null,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<CaptureLinkItem>((s) =>
    s.from("capture_links").insert(newLink).select().single()
  );
  if (handled && data) return data;

  mockDb.captureLinks.unshift(newLink);
  return newLink;
}

export async function getCaptureLinkBySlug(slug: string): Promise<CaptureLinkItem | null> {
  const { handled, data } = await withDb<CaptureLinkItem>((s) =>
    s.from("capture_links").select("*").eq("slug", slug.toLowerCase().trim()).maybeSingle()
  );
  if (handled) return data;
  return (
    mockDb.captureLinks.find((l: CaptureLinkItem) => l.slug.toLowerCase() === slug.toLowerCase()) || null
  );
}
