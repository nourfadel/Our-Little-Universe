import { AdminWorkspace } from "./AdminWorkspace";
import { requireAdmin } from "@/lib/supabase/auth";
import type { Memory, MemoryMedia, SiteSettings } from "@/types/memory";

export const dynamic = "force-dynamic";
type Entry = Memory & { media: Array<MemoryMedia & { url: string }> };

export default async function AdminPage() {
  const supabase = await requireAdmin();
  const [{ data: memories, error }, { data: media }, { data: setting }] = await Promise.all([
    supabase.from("memories").select("*").order("memory_date", { ascending: false }),
    supabase.from("memory_media").select("*").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("landing_message,button_label,initials,relationship_start_date,counter_label,counter_enabled").limit(1).maybeSingle(),
  ]);
  if (error) throw new Error(`Could not load admin data: ${error.message}`);
  const files = media ?? [];
  const { data: signed } = files.length ? await supabase.storage.from("memories").createSignedUrls(files.map((item) => item.file_path), 3600) : { data: [] };
  const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
  const byMemory = new Map<string, Entry["media"]>();
  files.forEach((item) => byMemory.set(item.memory_id, [...(byMemory.get(item.memory_id) ?? []), { ...item, url: urls.get(item.file_path) ?? "" }]));
  const entries: Entry[] = (memories ?? []).map((item) => ({ ...item, media: byMemory.get(item.id) ?? [] }));
  const settings: Omit<SiteSettings, "id" | "updated_at"> = setting ?? {
    landing_message: "ملقتش ونس للعمر أحسن منك", button_label: "US", initials: "A & A", relationship_start_date: null, counter_label: "We've been together for", counter_enabled: false,
  };
  return <AdminWorkspace memories={entries} settings={settings} />;
}
