import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getReplicateClient } from "@/lib/replicate";

/**
 * GET /api/predictions/[id]
 * Get prediction status from Replicate
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get prediction ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Prediction ID is required" },
        { status: 400 },
      );
    }

    // Initialize Replicate client
    const replicate = getReplicateClient();

    // Get prediction from Replicate
    const prediction = await replicate.predictions.get(id);

    // Calculate progress percentage if available
    let progress: number | null = null;
    if (prediction.status === "processing" || prediction.status === "starting") {
      // Replicate doesn't always provide progress, but we can estimate
      // based on status transitions or use a default
      progress = prediction.status === "starting" ? 10 : 50;
    } else if (prediction.status === "succeeded") {
      progress = 100;
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      progress = 0;
    }

    // Extract image URL from output
    let imageUrl: string | null = null;
    if (prediction.status === "succeeded" && prediction.output) {
      if (Array.isArray(prediction.output)) {
        imageUrl = prediction.output[0] as string;
      } else if (typeof prediction.output === "string") {
        imageUrl = prediction.output;
      }
    }

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      progress,
      imageUrl,
      createdAt: prediction.created_at,
      startedAt: prediction.started_at,
      completedAt: prediction.completed_at,
      error: prediction.error,
    });
  } catch (error: unknown) {
    console.error("[API] Error fetching prediction:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch prediction status";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

