import Link from "next/link";

// Phase 3 replaces this with the gallery, featured memory and viewer.
export default function MemoriesPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl font-light">Memories</h1>
      <p className="text-muted">The gallery arrives in the next phase.</p>
      <Link href="/" className="text-rose underline-offset-4 hover:underline">Back home</Link>
    </main>
  );
}
