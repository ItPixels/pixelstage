/**
 * Example usage of usePrediction hook
 * 
 * This file demonstrates how to use the usePrediction hook
 * in a React component
 */

"use client";

import { useState } from "react";
import { usePrediction } from "./use-prediction";
import { generateImageAction } from "@/app/actions/generate-image";

/**
 * Example component using usePrediction hook
 */
export function ImageGeneratorExample() {
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Use the hook to poll prediction status
  const { status, progress, imageUrl, isLoading, error, isComplete } =
    usePrediction(predictionId);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsGenerating(true);
    setPredictionId(null);

    try {
      const result = await generateImageAction(prompt, "schnell");

      if (result.success) {
        // Set prediction ID to start polling
        setPredictionId(result.prediction.id);
      } else {
        console.error("Error:", result.error);
        alert(result.error);
      }
    } catch (err) {
      console.error("Failed to generate image:", err);
      alert("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full px-4 py-2 rounded-lg bg-midnight text-white border border-gold/20"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || isLoading}
          className="mt-2 px-6 py-2 bg-gold text-midnight rounded-lg font-semibold disabled:opacity-50"
        >
          {isGenerating ? "Creating..." : "Generate Image"}
        </button>
      </div>

      {/* Status Display */}
      {predictionId && (
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
            <p className="text-sand">
              {status ? (
                <span className="capitalize">{status}</span>
              ) : (
                "Loading..."
              )}
            </p>
          </div>

          {/* Progress Bar */}
          {progress !== null && (
            <div>
              <div className="flex justify-between text-sm text-sand mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-midnight rounded-full h-2">
                <div
                  className="bg-gold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Image Display */}
          {imageUrl && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Generated Image
              </h3>
              <img
                src={imageUrl}
                alt="Generated"
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !isComplete && (
            <div className="flex items-center gap-2 text-sand">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold border-t-transparent" />
              <span>Polling prediction status...</span>
            </div>
          )}

          {/* Complete Indicator */}
          {isComplete && status === "succeeded" && !imageUrl && (
            <p className="text-gold">Processing complete! Image URL will appear shortly.</p>
          )}
        </div>
      )}
    </div>
  );
}

