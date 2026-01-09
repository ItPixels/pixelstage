"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DashboardNavLinks } from "@/components/DashboardNavLinks";

export const DashboardMobileHeader = () => {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-4 backdrop-blur lg:hidden">
      <Link
        href="/dashboard"
        className="text-base font-semibold text-white transition hover:text-emerald-300"
      >
        PixelStage
      </Link>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/5"
            aria-label="Открыть навигацию"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-black text-white">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white">Навигация</SheetTitle>
          </SheetHeader>
          <DashboardNavLinks />
        </SheetContent>
      </Sheet>
    </header>
  );
};

