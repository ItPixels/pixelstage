"use server";

import { auth } from "@clerk/nextjs/server";
import { getReplicateClient, FLUX_MODELS, type FluxModel } from "@/lib/replicate";
import {
  getUserBalance,
  decreaseUserBalance,
  getSupabaseAdmin,
} from "@/lib/supabase";

export type RoomType = "living-room" | "bedroom" | "majlis" | "office";
export type Style = "modern-islamic" | "luxury-minimal" | "boho";
export type { FluxModel } from "@/lib/replicate";

export type GenerateInteriorResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

/**
 * Build enhanced prompt based on room type and style
 */
function buildPrompt(
  basePrompt: string,
  roomType: RoomType,
  style: Style,
): string {
  let enhancedPrompt = basePrompt;

  // Add room type context
  const roomContext: Record<RoomType, string> = {
    "living-room": "luxury living room",
    bedroom: "luxury bedroom",
    majlis: "luxury majlis, traditional arabian reception room",
    office: "luxury office space",
  };

  enhancedPrompt = `${roomContext[roomType]}, ${enhancedPrompt}`;

  // Add style context
  const styleContext: Record<Style, string> = {
    "modern-islamic": "modern islamic interior design, contemporary arabian style, geometric patterns, luxury finishes",
    "luxury-minimal": "luxury minimalist interior design, clean lines, premium materials, sophisticated elegance",
    "boho": "bohemian interior design, eclectic style, natural textures, warm colors, relaxed luxury",
  };

  enhancedPrompt = `${enhancedPrompt}, ${styleContext[style]}`;

  // Special handling for Majlis and Modern Islamic style
  if (roomType === "majlis" || style === "modern-islamic") {
    enhancedPrompt = `${enhancedPrompt}, luxury arabian interior, gold accents, low seating, marble floor, panoramic window with dubai skyline view`;
  }

  // Add general interior design keywords
  enhancedPrompt = `${enhancedPrompt}, professional interior photography, high quality, 4k, detailed, realistic lighting`;

  return enhancedPrompt;
}

export const generateInterior = async (
  imageFile: File | null,
  roomType: RoomType,
  style: Style,
  model: FluxModel,
  customPrompt?: string,
): Promise<GenerateInteriorResult> => {
  try {
    // 1. Get current user
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // 2. Lazy Initialization: Check if user profile exists, create if not
    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, balance")
      .eq("id", userId)
      .maybeSingle();

    // If user doesn't exist (null data) or error occurred, create profile
    // Note: maybeSingle() returns null data when record not found
    // Also check for PostgREST error codes (PGRST116 = not found)
    const isUserNotFound =
      !userData ||
      (userError &&
        typeof userError === "object" &&
        "code" in userError &&
        String((userError as { code?: string }).code) === "PGRST116");

    if (isUserNotFound) {
      console.log(
        `[Lazy Init] User ${userId} profile not found, creating with 3 free credits`,
      );

      // Create user profile with 3 free credits
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        balance: 3, // Give 3 free credits on lazy initialization
      });

      if (insertError) {
        // If insert fails (e.g., race condition - user was created concurrently),
        // try to fetch again
        if (insertError.code === "23505") {
          // Unique constraint violation - user was created concurrently
          console.log(
            `[Lazy Init] User ${userId} was created concurrently, fetching balance`,
          );
          // Continue to balance check below
        } else {
          console.error("Error creating user profile:", insertError);
          return {
            success: false,
            error: "Error initializing user profile",
          };
        }
      } else {
        console.log(
          `[Lazy Init] User ${userId} profile created successfully with 3 credits`,
        );
      }
    }

    // 3. Check balance (after ensuring user exists)
    const balance = await getUserBalance(userId);

    if (balance === null) {
      return { success: false, error: "Error fetching balance" };
    }

    if (balance < 1) {
      return { success: false, error: "insufficient_balance" };
    }

    // 4. Decrease balance
    const newBalance = await decreaseUserBalance(userId, 1);

    if (newBalance === null) {
      return { success: false, error: "Error deducting credits" };
    }

    // 5. Build prompt
    const basePrompt = customPrompt || `redesign this ${roomType} in ${style} style`;
    const enhancedPrompt = buildPrompt(basePrompt, roomType, style);

    // 6. Prepare Replicate input
    const replicate = getReplicateClient();
    const modelId = FLUX_MODELS[model];

    const input: any = {
      prompt: enhancedPrompt,
      width: 1024,
      height: 1024,
    };

    // Add image if provided
    if (imageFile) {
      // Convert File to base64 or upload to a temporary URL
      // For now, we'll use the image as a data URL
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${imageFile.type};base64,${base64}`;
      
      // Replicate expects a URL, so we'd need to upload to a temporary storage first
      // For MVP, we'll skip image input and use prompt-only generation
      // TODO: Implement image upload to temporary storage (S3, Cloudinary, etc.)
    }

    // 7. Call Replicate API
    let imageUrl: string;

    try {
      const output = (await replicate.run(modelId, {
        input,
      })) as string[];

      imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl || typeof imageUrl !== "string") {
        // Refund credit
        const supabase = getSupabaseAdmin();
        await supabase
          .from("users")
          .update({ balance: balance })
          .eq("id", userId);

        return { success: false, error: "Image generation failed" };
      }
    } catch (replicateError) {
      // Refund credit
      const supabase = getSupabaseAdmin();
      await supabase
        .from("users")
        .update({ balance: balance })
        .eq("id", userId);

      console.error("Replicate API error:", replicateError);
      return {
        success: false,
        error: "Error calling generation API",
      };
    }

    // 8. Save to Supabase
    const { error: insertError } = await supabase
      .from("generated_images")
      .insert({
        user_id: userId,
        prompt: enhancedPrompt,
        image_url: imageUrl,
        aspect_ratio: "1:1",
        width: 1024,
        height: 1024,
        metadata: {
          room_type: roomType,
          style,
          model,
          original_prompt: customPrompt || basePrompt,
        },
      });

    if (insertError) {
      console.error("Error saving generated image:", insertError);
      // Don't refund, image was generated
    }

    // 9. Return result
    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error in generateInterior action:", error);
    return {
      success: false,
      error: "An error occurred during generation",
    };
  }
};

