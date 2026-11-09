"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveMemory(form: FormData) {
  const supabase = await requireAdmin();
  const id = text(form, "id");
  const title = text(form, "title");
  const memory_date = text(form, "memory_date");
  const caption = text(form, "caption") || null;
  const list = JSON.parse(text(form, "media") || "[]") as Array<{ id: string; file_path: string; media_type: "image" | "video" | "audio" }>;
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(memory_date)) throw new Error("Enter a title and valid memory date.");
  if (!list.length) throw new Error("Add at least one photo, video, or voice recording.");
  if (list.some((item) => !["image", "video", "audio"].includes(item.media_type) || !item.id || !item.file_path)) throw new Error("One of the uploaded media files is invalid.");
  const cover_media_id = text(form, "cover_media_id") || list.find((item) => item.media_type === "image" || item.media_type === "video")?.id || null;
  if (cover_media_id && !list.some((item) => item.id === cover_media_id && (item.media_type === "image" || item.media_type === "video"))) throw new Error("Choose a photo or video as the cover.");
  let memoryId = id;
  if (id) {
    const { error } = await supabase.from("memories").update({ title, memory_date, caption }).eq("id", id);
    if (error) throw new Error(error.message);
    const { data: oldMedia } = await supabase.from("memory_media").select("file_path").eq("memory_id", id);
    const { error: mediaError } = await supabase.from("memory_media").delete().eq("memory_id", id);
    if (mediaError) throw new Error(mediaError.message);
    const retained = new Set(list.map((item) => item.file_path));
    const removedPaths = (oldMedia ?? []).map((item) => item.file_path).filter((path) => !retained.has(path));
    if (removedPaths.length) {
      const { error: storageError } = await supabase.storage.from("memories").remove(removedPaths);
      if (storageError) throw new Error(`Media was saved, but old files could not be removed: ${storageError.message}`);
    }
  } else {
    const { data, error } = await supabase.from("memories").insert({ title, memory_date, caption }).select("id").single();
    if (error || !data) throw new Error(error?.message || "Could not create memory.");
    memoryId = data.id;
  }
  const { error: mediaError } = await supabase.from("memory_media").insert(list.map((item, sort_order) => ({ ...item, memory_id: memoryId, sort_order })));
  if (mediaError) throw new Error(mediaError.message);
  const { error: coverError } = await supabase.from("memories").update({ cover_media_id }).eq("id", memoryId);
  if (coverError) throw new Error(coverError.message);
  revalidatePath("/memories"); revalidatePath("/admin");
}

export async function removeMemory(form: FormData) {
  const supabase = await requireAdmin();
  const id = text(form, "id");
  const { data: media } = await supabase.from("memory_media").select("file_path").eq("memory_id", id);
  if (media?.length) {
    const { error: storageError } = await supabase.storage.from("memories").remove(media.map((m) => m.file_path));
    if (storageError) throw new Error(`Could not remove media files: ${storageError.message}`);
  }
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/memories"); revalidatePath("/admin");
}

export async function setFeatured(form: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("set_featured_memory", { p_id: text(form, "id") || null });
  if (error) throw new Error(error.message);
  revalidatePath("/memories"); revalidatePath("/admin");
}

export async function saveSettings(form: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("site_settings").update({
    landing_message: text(form, "landing_message"), button_label: text(form, "button_label"), initials: text(form, "initials"),
    relationship_start_date: text(form, "relationship_start_date") || null,
    counter_label: text(form, "counter_label"), counter_enabled: form.get("counter_enabled") === "on",
  }).not("id", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/"); revalidatePath("/admin");
}
