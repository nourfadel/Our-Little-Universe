import { Hero } from "@/components/landing/Hero";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic"; // settings are edited live from the admin dashboard

export default async function HomePage() {
  const settings = await getSiteSettings();
  return <Hero settings={settings} />;
}
