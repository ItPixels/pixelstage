"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInterior } from "@/app/actions/generate-interior";
import type { RoomType, Style } from "@/app/actions/generate-interior";
import type { FluxModel } from "@/lib/replicate";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { WhatsAppShare } from "@/components/ui/whatsapp-share";

export default function DashboardPage() {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [roomType, setRoomType] = useState<RoomType>("living-room");
  const [style, setStyle] = useState<Style>("modern-luxury");
  const [model, setModel] = useState<FluxModel>("schnell");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const result = await generateInterior(
        selectedFile,
        roomType,
        style,
        model,
      );

      if (result.success) {
        setGeneratedImage(result.imageUrl);
        toast.success("Interior design generated successfully!");
      } else {
        if (result.error === "insufficient_balance") {
          toast.error("Insufficient credits. Please purchase more credits.");
        } else {
          toast.error(result.error || "Failed to generate interior design");
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-black text-off-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">
            Interior Design Generator
          </h1>
          <p className="text-off-white/70">
            Transform your space with AI-powered interior design
          </p>
        </div>

        <div
          className={cn(
            "grid gap-6",
            isRTL ? "grid-cols-[1fr_400px]" : "grid-cols-[400px_1fr]",
          )}
        >
          {/* Sidebar - Settings */}
          <aside
            className={cn(
              "space-y-6",
              isRTL ? "order-2" : "order-1",
            )}
          >
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-off-white">
                    Room Type
                  </label>
                  <Select
                    value={roomType}
                    onValueChange={(value) => setRoomType(value as RoomType)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-off-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-deep-black border-white/10">
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="majlis">Majlis</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-off-white">
                    Style
                  </label>
                  <Select
                    value={style}
                    onValueChange={(value) => setStyle(value as Style)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-off-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-deep-black border-white/10">
                      <SelectItem value="modern-luxury">
                        Modern Luxury
                      </SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="arabic-traditional">
                        Arabic Traditional
                      </SelectItem>
                      <SelectItem value="japandi">Japandi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Model */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-off-white">
                    AI Model
                  </label>
                  <Select
                    value={model}
                    onValueChange={(value) => setModel(value as FluxModel)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-off-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-deep-black border-white/10">
                      <SelectItem value="schnell">
                        Fast (Flux Schnell)
                      </SelectItem>
                      <SelectItem value="dev">
                        High Quality (Flux Dev)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={cn(
                    "w-full bg-gradient-to-r from-gold to-gold/80",
                    "text-deep-black font-semibold",
                    "hover:from-gold/90 hover:to-gold/70",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 me-2" />
                      Generate Design
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Image Upload & Result */}
          <main
            className={cn(
              "space-y-6",
              isRTL ? "order-1" : "order-2",
            )}
          >
            {/* Image Upload */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">Upload Room Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageDropzone
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />
              </CardContent>
            </Card>

            {/* Generated Result */}
            {generatedImage && (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-gold">Generated Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={generatedImage}
                      alt="Generated interior design"
                      width={1024}
                      height={1024}
                      className="w-full h-auto"
                      loading="lazy"
                      quality={90}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = generatedImage;
                        link.download = "interior-design.png";
                        link.click();
                      }}
                      variant="outline"
                      className="border-white/10 text-off-white hover:bg-white/5"
                    >
                      Download
                    </Button>
                    <WhatsAppShare imageUrl={generatedImage} />
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
