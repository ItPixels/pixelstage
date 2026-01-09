"use client";

import { CreditsModal } from "@/components/ui/credits-modal";

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * BuyCreditsModal - Wrapper that shows CreditsModal
 * This maintains backward compatibility while using the new CreditsModal
 */
export function BuyCreditsModal({
  open,
  onOpenChange,
}: BuyCreditsModalProps) {
  return <CreditsModal open={open} onOpenChange={onOpenChange} />;
}

