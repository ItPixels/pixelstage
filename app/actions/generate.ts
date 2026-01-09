"use server";

import { auth } from "@clerk/nextjs/server";
import Replicate from "replicate";

import {
  decreaseUserBalance,
  getUserBalance,
  getSupabaseAdmin,
} from "@/lib/supabase";

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

export type GenerateResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

export const generate = async (
  prompt: string,
  aspectRatio: AspectRatio = "1:1",
): Promise<GenerateResult> => {
  try {
    // 1. Получить текущего пользователя через auth()
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Необходима авторизация" };
    }

    // 2. Проверить баланс в Supabase. Если < 1, бросить ошибку
    const balance = await getUserBalance(userId);

    if (balance === null) {
      return { success: false, error: "Ошибка получения баланса" };
    }

    if (balance < 1) {
      return { success: false, error: "insufficient_balance" };
    }

    // 3. Списываем 1 кредит (транзакция в БД)
    const newBalance = await decreaseUserBalance(userId, 1);

    if (newBalance === null) {
      return { success: false, error: "Ошибка списания кредитов" };
    }

    // 4. Отправляем запрос в Replicate API (модель black-forest-labs/flux-schnell)
    const { width, height } = aspectRatioToSize[aspectRatio];

    let imageUrl: string;

    try {
      const output = (await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt,
            width,
            height,
          },
        },
      )) as string[];

      imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl || typeof imageUrl !== "string") {
        // Если генерация не удалась, возвращаем кредит
        const supabase = getSupabaseAdmin();
        await supabase
          .from("users")
          .update({ balance: balance })
          .eq("id", userId);

        return { success: false, error: "Ошибка генерации изображения" };
      }
    } catch (replicateError) {
      // Если генерация не удалась, возвращаем кредит
      const supabase = getSupabaseAdmin();
      await supabase
        .from("users")
        .update({ balance: balance })
        .eq("id", userId);

      console.error("Replicate API error:", replicateError);
      return {
        success: false,
        error: "Ошибка при обращении к API генерации",
      };
    }

    // 5. Получили URL картинки
    // 6. Сохраняем запись в таблицу generated_images
    const supabase = getSupabaseAdmin();
    const { error: insertError } = await supabase
      .from("generated_images")
      .insert({
        user_id: userId,
        prompt,
        image_url: imageUrl,
        aspect_ratio: aspectRatio,
        width,
        height,
      });

    if (insertError) {
      console.error("Error saving generated image:", insertError);
      // Не возвращаем кредит, так как изображение уже сгенерировано
    }

    // 7. Возвращаем URL клиенту
    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error in generate action:", error);
    return {
      success: false,
      error: "Произошла ошибка при генерации изображения",
    };
  }
};

