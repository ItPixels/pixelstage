"use server";

import { auth } from "@clerk/nextjs/server";
import { getReplicateClient, FLUX_MODELS, type FluxModel } from "@/lib/replicate";
import { getUserBalance, decreaseUserBalance } from "@/lib/supabase";
import type { Prediction } from "replicate";

/**
 * Response type for generateImageAction
 */
export type GenerateImageResponse =
  | {
      success: true;
      prediction: Prediction;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Server Action to generate image using Replicate Flux models
 * @param prompt - Text prompt for image generation
 * @param model - Flux model to use ('schnell' or 'dev')
 * @returns Typed response with prediction or error
 */
export async function generateImageAction(
  prompt: string,
  model: FluxModel = "schnell",
): Promise<GenerateImageResponse> {
  try {
    // 1. Check user authentication
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. Please sign in to generate images.",
      };
    }

    // 2. Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: "Prompt cannot be empty.",
      };
    }

    // 3. Check user balance
    const balance = await getUserBalance(userId);

    if (balance === null) {
      return {
        success: false,
        error: "Failed to fetch user balance. Please try again.",
      };
    }

    if (balance < 1) {
      return {
        success: false,
        error: "Insufficient credits. Please purchase more credits to generate images.",
      };
    }

    // 4. Decrease balance before API call (optimistic update)
    const newBalance = await decreaseUserBalance(userId, 1);

    if (newBalance === null) {
      return {
        success: false,
        error: "Failed to deduct credits. Please try again.",
      };
    }

    // 5. Initialize Replicate client
    const replicate = getReplicateClient();

    // 6. Get model identifier
    const modelId = FLUX_MODELS[model];

    // 7. Create prediction
    let prediction: Prediction;

    try {
      prediction = await replicate.predictions.create({
        model: modelId,
        input: {
          prompt: prompt.trim(),
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 90,
        },
      });
    } catch (apiError: unknown) {
      // If API call fails, refund the credit
      console.error("[Replicate API Error]:", apiError);

      // Note: In production, you might want to implement a refund mechanism
      // For now, we'll just return the error

      const errorMessage =
        apiError instanceof Error
          ? apiError.message
          : "Failed to create prediction. Please try again later.";

      return {
        success: false,
        error: errorMessage,
      };
    }

    // 8. Return success response
    return {
      success: true,
      prediction,
    };
  } catch (error: unknown) {
    console.error("[generateImageAction Error]:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again later.";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

