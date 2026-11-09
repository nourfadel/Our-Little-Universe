export type MediaType = "image" | "video" | "audio";

export interface Memory {
  id: string;
  title: string;
  caption: string | null;
  memory_date: string; // YYYY-MM-DD
  cover_media_id: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemoryMedia {
  id: string;
  memory_id: string;
  file_path: string;
  media_type: MediaType;
  sort_order: number;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  landing_message: string;
  button_label: string;
  initials: string;
  relationship_start_date: string | null; // YYYY-MM-DD
  counter_label: string;
  counter_enabled: boolean;
  updated_at: string;
}
