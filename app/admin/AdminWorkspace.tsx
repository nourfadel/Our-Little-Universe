"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_FILE_ACCEPT, mediaTypeForFile } from "@/lib/media";
import { removeMemory, saveMemory, saveSettings, setFeatured } from "./actions";
import { signOut } from "@/app/login/actions";
import type { MediaType, Memory, MemoryMedia, SiteSettings } from "@/types/memory";

type Item = MemoryMedia & { url: string };
type Entry = Memory & { media: Item[] };
type Settings = Omit<SiteSettings, "id" | "updated_at">;
type PendingFile = { file: File; preview: string; kind: MediaType };

function MemoryEditor({ memory, fresh = false }: { memory?: Entry; fresh?: boolean }) {
  const [items, setItems] = useState<Item[]>(memory?.media ?? []);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  function chooseFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(""); setSuccess("");
    const chosen: PendingFile[] = [];
    for (const file of Array.from(files)) {
      const kind = mediaTypeForFile(file);
      if (!kind) { setError(`${file.name}: use a supported photo, video, or audio file under 100 MB.`); continue; }
      chosen.push({ file, kind, preview: URL.createObjectURL(file) });
    }
    setPendingFiles((current) => [...current, ...chosen]);
  }
  async function uploadQueued() {
    if (!pendingFiles.length || uploading) return;
    setError(""); setSuccess(""); setUploading(true); setUploadCount(0);
    const client = createClient();
    const completed: PendingFile[] = [];
    const failures: string[] = [];
    const batch = [...pendingFiles];
    for (const queued of batch) {
      const { file, kind } = queued;
      const id = crypto.randomUUID();
      const path = `${id}/${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: uploadError } = await client.storage.from("memories").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { failures.push(`${file.name}: ${uploadError.message}`); setUploadCount((n) => n + 1); continue; }
      const { data } = await client.storage.from("memories").createSignedUrl(path, 3600);
      setItems((current) => [...current, { id, file_path: path, media_type: kind, memory_id: memory?.id ?? "", sort_order: current.length, created_at: new Date().toISOString(), url: data?.signedUrl ?? "" }]);
      completed.push(queued); setUploadCount((n) => n + 1);
    }
    completed.forEach((file) => URL.revokeObjectURL(file.preview));
    setPendingFiles((current) => current.filter((file) => !completed.includes(file)));
    setUploading(false);
    if (failures.length) setError(`${failures.join(" ")} You can retry the failed files.`);
    else setSuccess("All selected media uploaded.");
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setSuccess("");
    if (uploading) { setError("Wait for the media upload to finish before saving this memory."); return; }
    if (pendingFiles.length) { setError("Upload the selected media, or remove it before saving this memory."); return; }
    const form = new FormData(e.currentTarget);
    form.set("media", JSON.stringify(items.map(({ id, file_path, media_type }) => ({ id, file_path, media_type }))));
    start(async () => {
      try { await saveMemory(form); setSuccess("Memory saved."); router.refresh(); }
      catch (err) { setError(err instanceof Error ? err.message : "Could not save memory."); }
    });
  }
  function move(index: number, by: number) {
    setItems((prev) => { const next = [...prev]; const target = index + by; if (target < 0 || target >= next.length) return prev; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  const visualItems = items.filter((item) => item.media_type === "image" || item.media_type === "video");
  const selectedCover = memory?.cover_media_id && visualItems.some((item) => item.id === memory.cover_media_id) ? memory.cover_media_id : visualItems[0]?.id;
  return <form onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 bg-card p-5">
    {memory && <input type="hidden" name="id" value={memory.id} />}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-muted">Title<input required name="title" defaultValue={memory?.title} className="field" /></label>
      <label className="text-sm text-muted">Memory date<input required type="date" name="memory_date" defaultValue={memory?.memory_date} className="field" /></label>
    </div>
    <label className="block text-sm text-muted">Caption<textarea name="caption" rows={2} defaultValue={memory?.caption ?? ""} className="field" /></label>
    <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chooseFiles(e.dataTransfer.files); }} className="block rounded-lg border border-dashed border-white/15 p-3 text-sm text-muted">Add photos, videos, or voice recordings · drop files here or choose them<input type="file" accept={MEDIA_FILE_ACCEPT} multiple onChange={(e) => { chooseFiles(e.currentTarget.files); e.currentTarget.value = ""; }} className="mt-2 block w-full text-white file:mr-3 file:rounded-md file:border-0 file:bg-rose/20 file:px-3 file:py-2 file:text-white" /></label>
    {pendingFiles.length > 0 && <div className="space-y-3 rounded-lg border border-white/10 p-3"><p className="text-sm">Preview before upload · {pendingFiles.length} selected</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{pendingFiles.map((item) => <div key={item.preview} className="relative"><button type="button" onClick={() => { URL.revokeObjectURL(item.preview); setPendingFiles((current) => current.filter((x) => x !== item)); }} className="absolute right-1 top-1 rounded bg-black/80 px-2 py-1 text-xs">Remove</button>{item.kind === "image" ? <Image src={item.preview} alt={item.file.name} width={320} height={320} unoptimized className="aspect-square w-full rounded object-cover" /> : item.kind === "video" ? <video src={item.preview} controls className="aspect-square w-full rounded object-cover" /> : <audio src={item.preview} controls className="mt-8 w-full" />}<p className="mt-1 truncate text-xs text-muted">{item.file.name}</p></div>)}</div><button type="button" disabled={uploading} onClick={() => void uploadQueued()} className="rounded-md bg-white/10 px-3 py-2 text-sm disabled:opacity-50">{uploading ? `Uploading ${uploadCount + 1} of ${pendingFiles.length}…` : "Upload selected media"}</button>{uploading && <progress aria-label="Upload progress" value={uploadCount} max={pendingFiles.length} className="ml-3 align-middle" />}</div>}
    {items.length > 0 && <div><p className="mb-2 text-xs text-emerald-300">{items.length} uploaded {items.length === 1 ? "file" : "files"} attached to this memory</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map((item, index) => <div key={item.id} className="rounded-lg border border-white/10 p-2">
      {item.media_type === "image" ? <Image src={item.url} alt="Media preview" width={320} height={320} unoptimized className="aspect-square w-full rounded object-cover" /> : item.media_type === "video" ? <video src={item.url} controls className="aspect-square w-full rounded object-cover" /> : <audio src={item.url} controls className="mt-8 w-full" aria-label="Voice recording preview" />}
      {(item.media_type === "image" || item.media_type === "video") && <label className="mt-2 flex items-center gap-2 text-xs"><input type="radio" name="cover_media_id" value={item.id} defaultChecked={item.id === selectedCover} /> Cover</label>}
      <div className="mt-2 flex justify-between text-xs"><button type="button" onClick={() => move(index, -1)} aria-label="Move earlier">↑</button><button type="button" className="text-rose" onClick={() => setItems((all) => all.filter((x) => x.id !== item.id))}>Remove</button><button type="button" onClick={() => move(index, 1)} aria-label="Move later">↓</button></div>
    </div>)}</div></div>}
    {error && <p role="alert" className="text-sm text-rose">{error}</p>}{success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
    <button disabled={busy || uploading || pendingFiles.length > 0} className="rounded-lg bg-rose px-5 py-2 text-sm font-medium disabled:opacity-50">{busy ? "Saving…" : uploading ? "Uploading media…" : pendingFiles.length ? "Upload or remove selected media" : fresh ? "Create memory" : "Save changes"}</button>
  </form>;
}

export function AdminWorkspace({ memories, settings }: { memories: Entry[]; settings: Settings }) {
  const [tab, setTab] = useState<"memories" | "settings">("memories");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, start] = useTransition();
  function actionCall(action: (f: FormData) => Promise<void>, form: FormData) {
    start(async () => { try { await action(form); setMessage("Saved."); router.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Action failed."); } });
  }
  return <main className="mx-auto min-h-dvh max-w-5xl px-5 py-10 sm:px-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.25em] text-rose">Our Little Universe</p><h1 className="mt-2 font-display text-4xl">Admin studio</h1></div><div className="flex items-center gap-4"><Link href="/" className="text-sm text-muted hover:text-white">Back to site</Link><form action={signOut}><button className="text-sm text-muted hover:text-white">Sign out</button></form></div></header>
    <nav className="mb-6 flex gap-2"><button onClick={() => setTab("memories")} className={`rounded-lg px-4 py-2 text-sm ${tab === "memories" ? "bg-rose text-white" : "bg-surface text-muted"}`}>Memories</button><button onClick={() => setTab("settings")} className={`rounded-lg px-4 py-2 text-sm ${tab === "settings" ? "bg-rose text-white" : "bg-surface text-muted"}`}>Landing & counter</button></nav>
    {tab === "memories" ? <div className="space-y-8"><section><h2 className="mb-3 font-display text-2xl">Add a memory</h2><MemoryEditor fresh /></section><section><h2 className="mb-3 font-display text-2xl">All memories <span className="text-base text-muted">({memories.length})</span></h2>{!memories.length && <p className="text-sm text-muted">No memories yet.</p>}<div className="space-y-5">{memories.map((memory) => <details key={memory.id} className="group"><summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-white/10 bg-surface p-4"><span><strong>{memory.title}</strong><span className="ml-3 text-sm text-muted">{memory.memory_date}</span></span><span className="text-sm text-rose">{memory.is_featured ? "Featured · Edit" : "Edit"}</span></summary><div className="mt-3 space-y-3"><MemoryEditor memory={memory} /><div className="flex flex-wrap gap-2"><form action={(f) => actionCall(setFeatured, f)}><input type="hidden" name="id" value={memory.is_featured ? "" : memory.id} /><button className="rounded-md border border-white/15 px-3 py-2 text-sm">{memory.is_featured ? "Remove featured" : "Set as featured"}</button></form><form action={(f) => { if (confirm(`Delete “${memory.title}” and its media?`)) actionCall(removeMemory, f); }}><input type="hidden" name="id" value={memory.id} /><button className="rounded-md border border-rose/40 px-3 py-2 text-sm text-rose">Delete memory</button></form></div></div></details>)}</div></section></div>
      : <section><h2 className="mb-3 font-display text-2xl">Landing page settings</h2><form action={(f) => actionCall(saveSettings, f)} className="space-y-4 rounded-xl border border-white/10 bg-card p-5">
        <label className="block text-sm text-muted">Headline<textarea name="landing_message" defaultValue={settings.landing_message} required rows={2} className="field" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-muted">Button label<input name="button_label" defaultValue={settings.button_label} required className="field" /></label><label className="text-sm text-muted">Initials<input name="initials" defaultValue={settings.initials} required className="field" /></label></div>
        <label className="block text-sm text-muted">Relationship start date<input name="relationship_start_date" type="date" defaultValue={settings.relationship_start_date ?? ""} className="field" /></label>
        <label className="block text-sm text-muted">Counter label<input name="counter_label" defaultValue={settings.counter_label} required className="field" /></label>
        <label className="flex items-center gap-2 text-sm"><input name="counter_enabled" type="checkbox" defaultChecked={settings.counter_enabled} /> Show relationship counter</label>
        <button disabled={busy} className="rounded-lg bg-rose px-5 py-2 text-sm disabled:opacity-50">Save settings</button>
      </form></section>}
    {message && <p role="status" className="mt-4 text-sm text-muted">{message}</p>}
  </main>;
}
