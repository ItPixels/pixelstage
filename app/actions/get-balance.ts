"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserBalance } from "@/lib/supabase";

export type GetBalanceResult =
  | { success: true; balance: number }
  | { success: false; error: string };

/**
 * Get user's current credit balance
 */
export async function getBalance(): Promise<GetBalanceResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const balance = await getUserBalance(userId);

    if (balance === null) {
      return { success: false, error: "Failed to fetch balance" };
    }

    return { success: true, balance };
  } catch (error) {
    console.error("Error in getBalance:", error);
    return { success: false, error: "An error occurred" };
  }
}

