"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

/**
 * Prediction status response from API
 */
interface PredictionStatus {
  id: string;
  status: string;
  progress: number | null;
  imageUrl: string | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

/**
 * Return type for usePrediction hook
 */
interface UsePredictionReturn {
  status: string | null;
  progress: number | null;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
}

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string): Promise<PredictionStatus> => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch prediction status");
  }

  return response.json();
};

/**
 * Custom hook to poll prediction status
 * Uses SWR for data fetching with automatic polling
 * 
 * @param predictionId - Replicate prediction ID or null
 * @returns Prediction status, progress, image URL, and loading state
 */
export function usePrediction(
  predictionId: string | null,
): UsePredictionReturn {
  const [isComplete, setIsComplete] = useState(false);

  // SWR configuration
  const { data, error, isLoading } = useSWR<PredictionStatus>(
    predictionId ? `/api/predictions/${predictionId}` : null,
    fetcher,
    {
      // Poll every 2 seconds while prediction is in progress
      refreshInterval: (data) => {
        // Stop polling if prediction is complete
        if (
          !data ||
          data.status === "succeeded" ||
          data.status === "failed" ||
          data.status === "canceled"
        ) {
          return 0; // Stop polling
        }
        return 2000; // Poll every 2 seconds
      },
      // Retry on error
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Revalidate on focus
      revalidateOnFocus: false,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
    },
  );

  // Update completion state
  useEffect(() => {
    if (data) {
      const completed =
        data.status === "succeeded" ||
        data.status === "failed" ||
        data.status === "canceled";
      setIsComplete(completed);
    }
  }, [data?.status]);

  return {
    status: data?.status ?? null,
    progress: data?.progress ?? null,
    imageUrl: data?.imageUrl ?? null,
    isLoading: isLoading && !data,
    error: error?.message ?? data?.error ?? null,
    isComplete,
  };
}

