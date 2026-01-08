"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateImage, type GenerateImageResult } from "@/app/actions/generateImage";

type AspectRatio = "1:1" | "16:9" | "9:16";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Введите промпт для генерации");
      return;
    }

    setIsLoading(true);
    setImageUrl(null);

    try {
      const result: GenerateImageResult = await generateImage(
        prompt,
        aspectRatio,
      );

      if (result.success) {
        setImageUrl(result.imageUrl);
        toast.success("Изображение успешно сгенерировано!");
      } else {
        if (result.error === "insufficient_balance") {
          toast.error("Недостаточно кредитов. Пожалуйста, пополните баланс.");
        } else {
          toast.error(result.error || "Ошибка при генерации изображения");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Произошла ошибка при генерации изображения");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cyberpunk cat..."
            className="min-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-zinc-400 focus:border-emerald-400/50"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={aspectRatio}
            onValueChange={(value) => setAspectRatio(value as AspectRatio)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white focus:border-emerald-400/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерация...
              </>
            ) : (
              "Сгенерировать"
            )}
          </Button>
        </div>
      </form>

      {imageUrl && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 p-4">
          <div className="relative aspect-square w-full max-w-2xl mx-auto">
            <Image
              src={imageUrl}
              alt="Generated image"
              fill
              className="object-contain rounded-lg"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;

