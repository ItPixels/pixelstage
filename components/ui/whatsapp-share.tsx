"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppShareProps {
  imageUrl: string;
  className?: string;
}

/**
 * WhatsApp Share Button Component
 * Opens WhatsApp with pre-filled message and image link
 */
export function WhatsAppShare({ imageUrl, className }: WhatsAppShareProps) {
  const handleShare = () => {
    const message = encodeURIComponent(
      `Check out this AI-generated interior design from PixelStage!\n\n${imageUrl}`,
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      onClick={handleShare}
      className={cn(
        "bg-[#25D366] hover:bg-[#20BA5A] text-white",
        "transition-colors duration-200",
        className,
      )}
      size="default"
    >
      <MessageCircle className="w-4 h-4 me-2" />
      Share to Client via WhatsApp
    </Button>
  );
}

