"use client";
import { useEffect, useMemo, useState } from "react";
import type { Memory, MemoryMedia } from "@/types/memory";

export type BrowserMemory = Memory & { media: Array<MemoryMedia & { url: string }> };
const prettyDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

function Viewer({ memory, close, change }: { memory: BrowserMemory; close: () => void; change: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const media = memory.media[index];
  const step = (amount: number) => setIndex((i) => (i + amount + memory.media.length) % memory.media.length);
  useEffect(() => { setIndex(0); }, [memory.id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    window.addEventListener("keydown", key); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [memory.id]);
  let touchX = 0;
  return <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={memory.title} onTouchStart={(e) => { touchX = e.touches[0].clientX; }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }}>
    <header className="flex items-center justify-between gap-3 text-white"><div className="min-w-0"><h2 className="truncate font-display text-2xl">{memory.title}</h2><p className="text-sm text-white/60">{prettyDate(memory.memory_date)} · {index + 1} / {memory.media.length}</p></div><button onClick={close} className="rounded-full border border-white/20 px-4 py-2" aria-label="Close viewer">Close</button></header>
    <div className="flex min-h-0 flex-1 items-center justify-center gap-2 py-3"><button onClick={() => step(-1)} className="rounded-full bg-white/10 px-3 py-3" aria-label="Previous media">‹</button><div className="flex h-full min-w-0 flex-1 items-center justify-center">{media?.media_type === "audio" ? <audio key={media.id} src={media.url} controls className="w-full max-w-xl" aria-label={`Voice recording for ${memory.title}`} /> : media?.media_type === "video" ? <video key={media.id} src={media.url} controls autoPlay playsInline className="max-h-full max-w-full" /> : <img key={media?.id} src={media?.url} alt={`${memory.title} ${index + 1}`} className="max-h-full max-w-full object-contain" />}</div><button onClick={() => step(1)} className="rounded-full bg-white/10 px-3 py-3" aria-label="Next media">›</button></div>
    <footer className="mx-auto w-full max-w-3xl text-center"><p className="text-sm text-white/70">{memory.caption}</p><div className="mt-3 flex justify-center gap-2">{memory.media.map((m, i) => <button key={m.id} onClick={() => setIndex(i)} aria-label={`Show item ${i + 1}`} className={`h-1.5 w-8 rounded-full ${i === index ? "bg-rose" : "bg-white/25"}`} />)}</div></footer>
  </div>;
}

export function MemoryBrowser({ memories }: { memories: BrowserMemory[] }) {
  const [selected, setSelected] = useState<BrowserMemory | null>(null);
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const featured = memories.find((m) => m.is_featured);
  const years = [...new Set(memories.map((m) => m.memory_date.slice(0, 4)))];
  const filtered = useMemo(() => memories.filter((m) => (year === "all" || m.memory_date.slice(0, 4) === year) && (month === "all" || m.memory_date.slice(5, 7) === month)), [memories, year, month]);
  const groups = filtered.reduce<Record<string, Record<string, BrowserMemory[]>>>((all, item) => { const [y, mo] = item.memory_date.split("-"); (all[y] ??= {})[mo] ??= []; all[y][mo].push(item); return all; }, {});
  const open = (m: BrowserMemory) => setSelected(m);
  const change = (id: string) => { const next = memories.find((m) => m.id === id); if (next) setSelected(next); };
  const card = (m: BrowserMemory, larger = false) => {
    const cover = m.media.find((x) => x.id === m.cover_media_id) ?? m.media[0];
    return <button key={m.id} onClick={() => open(m)} className={`group overflow-hidden rounded-xl border border-white/10 bg-card text-left shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-rose/40 ${larger ? "grid md:grid-cols-2" : ""}`}>
      <div className={`relative overflow-hidden bg-white p-1 ${larger ? "min-h-64" : "aspect-[4/3]"}`}>{cover?.media_type === "video" ? <video src={cover.url} muted preload="none" className="h-full w-full object-cover" /> : cover?.media_type === "image" ? <img src={cover.url} alt={m.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center bg-surface text-muted">{m.media.some((item) => item.media_type === "audio") ? "♪ Voice memory" : "No cover selected"}</div>}<span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-xs">{m.media.length} {m.media.length === 1 ? "item" : "items"}</span></div>
      <div className="p-4"><div className="flex flex-wrap items-center gap-2">{larger && <span className="text-[10px] uppercase tracking-[.2em] text-rose">Our special memory</span>}{m.is_featured && !larger && <span className="text-[10px] uppercase tracking-[.16em] text-rose">Featured</span>}</div><h3 className="mt-1 font-display text-2xl">{m.title}</h3><p className="mt-1 text-xs text-muted">{prettyDate(m.memory_date)}</p>{m.caption && <p className="mt-3 line-clamp-2 text-sm text-white/75">{m.caption}</p>}</div>
    </button>;
  };
  return <>
    {featured && <section className="mb-12"><h2 className="mb-4 text-xs uppercase tracking-[.25em] text-rose">Our special memory</h2><div className="max-w-4xl">{card(featured, true)}</div></section>}
    <section><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-3xl">The memories</h2><p className="mt-1 text-sm text-muted">{filtered.length} moments · newest first</p></div><div className="flex gap-2"><label className="sr-only" htmlFor="year">Filter by year</label><select id="year" value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md bg-surface px-3 py-2 text-sm"><option value="all">All years</option>{years.map((y) => <option key={y}>{y}</option>)}</select><label className="sr-only" htmlFor="month">Filter by month</label><select id="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md bg-surface px-3 py-2 text-sm"><option value="all">All months</option>{Array.from({ length: 12 }, (_, i) => { const val = String(i + 1).padStart(2, "0"); return <option key={val} value={val}>{new Date(2020, i, 1).toLocaleString(undefined, { month: "long" })}</option>; })}</select></div></div>
      {filtered.length === 0 ? <div className="rounded-xl border border-white/10 bg-card px-6 py-16 text-center"><p className="font-display text-2xl">A little room for what comes next.</p><p className="mt-2 text-sm text-muted">No memories here yet.</p></div> : <div className="space-y-10">{Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([y, months]) => <section key={y}><h3 className="mb-5 flex items-center gap-3 font-display text-4xl">{y}<span className="text-sm text-muted">{Object.values(months).flat().length} memories</span></h3>{Object.entries(months).sort(([a], [b]) => b.localeCompare(a)).map(([mo, rows]) => <div key={mo} className="mb-7"><h4 className="mb-3 text-sm uppercase tracking-[.16em] text-white/60">{new Date(Number(y), Number(mo) - 1, 1).toLocaleString(undefined, { month: "long" })}</h4><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((m) => card(m))}</div></div>)}</section>)}</div>}</section>
    {selected && <Viewer memory={selected} close={() => setSelected(null)} change={change} />}
  </>;
}
