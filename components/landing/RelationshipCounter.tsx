"use client";
import { useEffect, useState } from "react";
import { daysSince, msUntilNextMidnight } from "@/lib/utils";

interface Props {
  startDate: string | null;
  label: string;
  enabled: boolean;
}

export function RelationshipCounter({ startDate, label, enabled }: Props) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !startDate) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setDays(daysSince(startDate));
      timer = setTimeout(tick, msUntilNextMidnight()); // refresh itself at local midnight
    };
    tick();
    return () => clearTimeout(timer);
  }, [startDate, enabled]);

  if (!enabled || !startDate) return null;

  return (
    <div className="text-center" aria-live="polite">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-5xl font-light tracking-wide sm:text-6xl">
        {/* Reserve the space until the client calculates the date, avoiding a layout jump. */}
        <span className={days === null ? "opacity-0" : "opacity-100 transition-opacity duration-700"}>
          {(days ?? 0).toLocaleString("en-US")}
        </span>{" "}
        <span className="text-2xl text-rose sm:text-3xl">days</span>
      </p>
      <p className="mt-2 text-sm italic text-muted">And counting...</p>
    </div>
  );
}
