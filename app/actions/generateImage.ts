"use server";

import { auth } from "@clerk/nextjs/server";
import Replicate from "replicate";

import { decreaseUserBalance, getUserBalance } from "@/lib/supabase";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type AspectRatio = "1:1" | "16:9" | "9:16";

const aspectRatioToSize: Record<AspectRatio, { width: number; height: number }> =
  {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1344, height: 768 },
    "9:16": { width: 768, height: 1344 },
  };

export type GenerateImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<GenerateImageResult> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Необходима авторизация" };
    }

    // Проверяем баланс
    const balance = await getUserBalance(userId);

    if (balance === null) {
      return { success: false, error: "Ошибка получения баланса" };
    }

    if (balance < 1) {
      return { success: false, error: "insufficient_balance" };
    }

    // Генерируем изображение через Replicate (Flux)
    const { width, height } = aspectRatioToSize[aspectRatio];

    const output = (await replicate.run(
      "black-forest-labs/flux-pro",
      {
        input: {
          prompt,
          width,
          height,
        },
      },
    )) as string[];

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl || typeof imageUrl !== "string") {
      return { success: false, error: "Ошибка генерации изображения" };
    }

    // Списываем кредит
    const newBalance = await decreaseUserBalance(userId, 1);

    if (newBalance === null) {
      return { success: false, error: "Ошибка списания кредитов" };
    }

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error: "Произошла ошибка при генерации изображения",
    };
  }
};

