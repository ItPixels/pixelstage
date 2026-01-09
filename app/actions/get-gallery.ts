"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export type GalleryImage = {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
  metadata?: {
    room_type?: string;
    style?: string;
    model?: string;
  };
};

export type GetGalleryResult =
  | { success: true; images: GalleryImage[] }
  | { success: false; error: string };

/**
 * Get user's generated images gallery
 */
export async function getGallery(): Promise<GetGalleryResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("generated_images")
      .select("id, image_url, prompt, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching gallery:", error);
      return { success: false, error: "Failed to fetch gallery" };
    }

    return {
      success: true,
      images: (data || []).map((img) => ({
        id: img.id,
        image_url: img.image_url,
        prompt: img.prompt,
        created_at: img.created_at,
        metadata: img.metadata as GalleryImage["metadata"],
      })),
    };
  } catch (error) {
    console.error("Error in getGallery:", error);
    return { success: false, error: "An error occurred" };
  }
}

