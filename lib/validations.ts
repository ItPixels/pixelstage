/**
 * Validate and normalize credits amount
 * @param credits - Credits value (can be string or number)
 * @returns Normalized credits number or null if invalid
 */
export function validateCredits(credits: unknown): {
  valid: boolean;
  credits: number | null;
  error?: string;
} {
  // Normalize to number
  let normalized: number;
  
  if (typeof credits === "string") {
    normalized = Number(credits);
  } else if (typeof credits === "number") {
    normalized = credits;
  } else {
    return {
      valid: false,
      credits: null,
      error: `Invalid credits type: ${typeof credits}, value: ${JSON.stringify(credits)}`,
    };
  }

  // Check if valid number
  if (isNaN(normalized) || !isFinite(normalized)) {
    return {
      valid: false,
      credits: null,
      error: `Invalid credits value: ${credits} (not a number)`,
    };
  }

  // Check if integer
  if (!Number.isInteger(normalized)) {
    return {
      valid: false,
      credits: null,
      error: `Invalid credits value: ${credits} (must be integer)`,
    };
  }

  // Check if in allowed set
  const allowedCredits = [10, 50, 100];
  if (!allowedCredits.includes(normalized)) {
    return {
      valid: false,
      credits: null,
      error: `Invalid credits amount: ${credits}. Supported: 10, 50, 100`,
    };
  }

  return {
    valid: true,
    credits: normalized,
  };
}

