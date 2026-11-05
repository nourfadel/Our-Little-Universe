import { AnimatedHeart } from "./AnimatedHeart";
import { EnterButton } from "./EnterButton";
import { RelationshipCounter } from "./RelationshipCounter";
import type { SiteSettings } from "@/types/memory";

type Settings = Omit<SiteSettings, "id" | "updated_at">;

export function Hero({ settings }: { settings: Settings }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-9 overflow-hidden px-6 py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/10 blur-[120px]" />
      <AnimatedHeart initials={settings.initials} />
      <h1
        dir="auto"
        className="max-w-2xl text-balance text-center font-arabic text-4xl leading-snug sm:text-6xl"
      >
        {settings.landing_message}
      </h1>
      <EnterButton label={settings.button_label} />
      <RelationshipCounter
        startDate={settings.relationship_start_date}
        label={settings.counter_label}
        enabled={settings.counter_enabled}
      />
    </main>
  );
}
