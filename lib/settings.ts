import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types/memory";

/** Fallbacks are only used if the settings row cannot be read. They are not the source of truth. */
const FALLBACK: Omit<SiteSettings, "id" | "updated_at"> = {
  landing_message: "ملقتش ونس للعمر أحسن منك",
  button_label: "US",
  initials: "A & A",
  relationship_start_date: null,
  counter_label: "We've been together for",
  counter_enabled: false,
};

export async function getSiteSettings(): Promise<Omit<SiteSettings, "id" | "updated_at">> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("landing_message,button_label,initials,relationship_start_date,counter_label,counter_enabled")
    .limit(1)
    .maybeSingle();
  if (error || !data) return FALLBACK;
  return data;
}
