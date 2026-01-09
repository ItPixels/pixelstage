import Replicate from "replicate";

/**
 * Get Replicate client instance
 * @returns Replicate client
 * @throws Error if REPLICATE_API_TOKEN is not set
 */
export const getReplicateClient = (): Replicate => {
  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set. Please configure it in your environment variables.",
    );
  }

  return new Replicate({
    auth: apiToken,
  });
};

/**
 * Flux model identifiers
 */
export const FLUX_MODELS = {
  schnell: "black-forest-labs/flux-schnell",
  dev: "black-forest-labs/flux-dev",
} as const;

export type FluxModel = keyof typeof FLUX_MODELS;

