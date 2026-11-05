"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function EnterButton({ label }: { label: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  function go() {
    if (leaving) return;
    setLeaving(true);
    router.prefetch("/memories");
    setTimeout(() => router.push("/memories"), reduce ? 0 : 450);
  }

  return (
    <>
      <button
        onClick={go}
        className="rounded-lg border border-rose bg-rose/10 px-12 py-3.5 text-lg tracking-[0.2em] text-white shadow-[0_0_30px_-6px_#A83245] transition hover:bg-rose hover:shadow-[0_0_44px_-4px_#A83245] active:scale-[0.98]"
      >
        {label}
      </button>
      <AnimatePresence>
        {leaving && (
          <motion.div
            aria-hidden
            className="fixed inset-0 z-50 bg-ink"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: "easeIn" }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
