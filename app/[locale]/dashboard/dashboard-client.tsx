"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Sparkles, Loader2, Image as ImageIcon, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
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
import { Skeleton } from "@/components/ui/skeleton";
import { BuyCreditsModal } from "@/components/ui/buy-credits-modal";
import { WhatsAppShare } from "@/components/ui/whatsapp-share";
import { generateInterior } from "@/app/actions/generate-interior";
import { getBalance } from "@/app/actions/get-balance";
import { getGallery, type GalleryImage } from "@/app/actions/get-gallery";
import type { Style } from "@/app/actions/generate-interior";
import type { FluxModel } from "@/lib/replicate";
import { cn } from "@/lib/utils";

export function DashboardClient() {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [style, setStyle] = useState<Style>("modern-islamic");
  const [model, setModel] = useState<FluxModel>("schnell");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Load balance and gallery on mount
  useEffect(() => {
    loadBalance();
    loadGallery();
  }, []);

  const loadBalance = async () => {
    setIsLoadingBalance(true);
    const result = await getBalance();
    if (result.success) {
      setBalance(result.balance);
    }
    setIsLoadingBalance(false);
  };

  const loadGallery = async () => {
    setIsLoadingGallery(true);
    const result = await getGallery();
    if (result.success) {
      setGallery(result.images);
    }
    setIsLoadingGallery(false);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    // Check balance first (use current state, then verify with API)
    if (balance === null) {
      const balanceResult = await getBalance();
      if (!balanceResult.success || balanceResult.balance === 0) {
        setShowBuyModal(true);
        return;
      }
      setBalance(balanceResult.balance);
    } else if (balance === 0) {
      setShowBuyModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    // Store current balance to check if it was the last credit
    const balanceBeforeGeneration = balance || 0;

    try {
      const result = await generateInterior(
        selectedFile,
        "living-room", // Default room type
        style,
        model,
      );

      if (result.success) {
        setGeneratedImage(result.imageUrl);
        toast.success("Interior design generated successfully!");
        
        // Reload balance and gallery
        await Promise.all([loadBalance(), loadGallery()]);

        // Check if user spent their last credit
        const newBalanceResult = await getBalance();
        if (
          newBalanceResult.success &&
          balanceBeforeGeneration === 1 &&
          newBalanceResult.balance === 0
        ) {
          toast.info("Hope you liked it! Upgrade to create more.", {
            duration: 5000,
          });
        }
      } else {
        if (result.error === "insufficient_balance") {
          setShowBuyModal(true);
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gold mb-2">
                Interior Design Generator
              </h1>
              <p className="text-off-white/70">
                Transform your space with AI-powered interior design
              </p>
            </div>
            <div className="text-end space-y-2">
              {isLoadingBalance ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24 ms-auto" />
                  <Skeleton className="h-8 w-16 ms-auto" />
                </div>
              ) : balance !== null ? (
                <>
                  <div className="flex items-center gap-2 justify-end">
                    {balance === 3 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                        <BadgeCheck className="w-3 h-3" />
                        Free Trial: 3 left
                      </span>
                    )}
                    {balance > 0 && balance !== 3 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                        <BadgeCheck className="w-3 h-3" />
                        Free Trial Active
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-off-white/60 mb-1">Credits</p>
                    <p className="text-2xl font-bold text-gold">{balance}</p>
                  </div>
                </>
              ) : (
                <div className="text-sm text-off-white/60">Loading...</div>
              )}
            </div>
          </div>
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
                      <SelectItem value="modern-islamic">
                        Modern Islamic
                      </SelectItem>
                      <SelectItem value="luxury-minimal">
                        Luxury Minimal
                      </SelectItem>
                      <SelectItem value="boho">Boho</SelectItem>
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
                  onClick={() => {
                    if (balance === 0) {
                      setShowBuyModal(true);
                    } else {
                      handleGenerate();
                    }
                  }}
                  disabled={isGenerating || (balance !== null && balance === 0)}
                  className={cn(
                    "w-full bg-gradient-to-r from-gold to-gold/80",
                    "text-deep-black font-semibold",
                    "hover:from-gold/90 hover:to-gold/70",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    // Don't visually disable if balance is null (loading) or > 0
                    balance === 0 && "cursor-pointer",
                  )}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      Generating...
                    </>
                  ) : balance === 0 ? (
                    <>
                      <Sparkles className="w-4 h-4 me-2" />
                      Buy Credits to Generate
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 me-2" />
                      Generate
                    </>
                  )}
                </Button>
                
                {/* Show message if no credits */}
                {balance === 0 && (
                  <p className="text-xs text-off-white/60 text-center mt-2">
                    You need credits to generate designs. Click the button above
                    to purchase a credit pack.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main
            className={cn(
              "space-y-6",
              isRTL ? "order-1" : "order-2",
            )}
          >
            {/* Image Upload */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">Upload Apartment Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageDropzone
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />
              </CardContent>
            </Card>

            {/* Generated Result */}
            {isGenerating && (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-gold">Generating...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="w-full h-96 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="w-3/4 h-4" />
                      <Skeleton className="w-1/2 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedImage && !isGenerating && (
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

            {/* Gallery */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">Your Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingGallery ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="w-full h-48 rounded-lg" />
                    ))}
                  </div>
                ) : gallery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gold/50 mb-4" />
                    <p className="text-off-white/70">
                      No generated designs yet. Create your first one!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-gold/50 transition-colors"
                      >
                        <Image
                          src={image.image_url}
                          alt={image.prompt}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 start-0 end-0 p-3">
                            <p className="text-xs text-off-white line-clamp-2">
                              {image.prompt}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal open={showBuyModal} onOpenChange={setShowBuyModal} />
    </div>
  );
}

