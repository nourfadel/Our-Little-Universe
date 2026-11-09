import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MemoryBrowser, type BrowserMemory } from "@/components/memories/MemoryBrowser";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const supabase = await createClient();
  const [{ data: rows, error }, { data: mediaRows }] = await Promise.all([
    supabase.from("memories").select("*").order("memory_date", { ascending: false }),
    supabase.from("memory_media").select("*").order("sort_order", { ascending: true }),
  ]);
  if (error) throw new Error(`Could not load memories: ${error.message}`);
  const media = mediaRows ?? [];
  const { data: signed } = media.length ? await supabase.storage.from("memories").createSignedUrls(media.map((m) => m.file_path), 3600) : { data: [] };
  const signedMap = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
  const grouped = new Map<string, typeof media>();
  for (const item of media) grouped.set(item.memory_id, [...(grouped.get(item.memory_id) ?? []), item]);
  const memories: BrowserMemory[] = (rows ?? []).map((memory) => ({ ...memory, media: (grouped.get(memory.id) ?? []).map((item) => ({ ...item, url: signedMap.get(item.file_path) ?? "" })) }));
  return <main className="mx-auto min-h-dvh max-w-6xl px-5 py-10 sm:px-8">
    <header className="mb-12 flex items-center justify-between"><Link href="/" className="text-sm text-muted hover:text-white">← Our universe</Link><Link href="/admin" className="text-xs text-muted hover:text-white">Manage</Link></header>
    <div className="mb-12"><p className="text-xs uppercase tracking-[.25em] text-rose">A little universe of us</p><h1 className="mt-2 font-display text-5xl font-light sm:text-6xl">Our memories</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Every little moment that became part of our story.</p></div>
    <MemoryBrowser memories={memories} />
  </main>;
}
