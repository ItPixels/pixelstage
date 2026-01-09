"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Alternative implementation using useEffect with interval
 * Use this if you prefer not to use SWR
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

interface UsePredictionReturn {
  status: string | null;
  progress: number | null;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
}

/**
 * Alternative hook using useEffect with interval
 * This is a fallback option if SWR is not preferred
 */
export function usePredictionWithInterval(
  predictionId: string | null,
): UsePredictionReturn {
  const [data, setData] = useState<PredictionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrediction = async () => {
    if (!predictionId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/predictions/${predictionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch prediction status");
      }

      const result: PredictionStatus = await response.json();
      setData(result);

      // Stop polling if prediction is complete
      if (
        result.status === "succeeded" ||
        result.status === "failed" ||
        result.status === "canceled"
      ) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch prediction status";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!predictionId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchPrediction();

    // Set up polling interval (every 2 seconds)
    intervalRef.current = setInterval(() => {
      fetchPrediction();
    }, 2000);

    // Cleanup on unmount or when predictionId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [predictionId]);

  const isComplete =
    data?.status === "succeeded" ||
    data?.status === "failed" ||
    data?.status === "canceled" ||
    false;

  return {
    status: data?.status ?? null,
    progress: data?.progress ?? null,
    imageUrl: data?.imageUrl ?? null,
    isLoading: isLoading && !data,
    error: error ?? data?.error ?? null,
    isComplete,
  };
}

