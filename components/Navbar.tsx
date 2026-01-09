"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const locale = useLocale();

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-white/10 bg-deep-black/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold text-gold transition hover:text-gold/80"
        >
          PixelStage
        </Link>

        <div className="flex items-center gap-4">
          <SignedOut>
            <Button
              asChild
              size="sm"
              className={cn(
                "bg-gradient-to-r from-gold to-gold/80",
                "text-deep-black font-semibold",
                "hover:from-gold/90 hover:to-gold/70",
                "transition-all duration-300"
              )}
            >
              <Link href={`/${locale}/sign-in`}>Sign In</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-off-white hover:text-gold hover:bg-white/5"
              >
                <Link href={`/${locale}/dashboard`}>Dashboard</Link>
              </Button>
              <UserButton
                afterSignOutUrl={`/${locale}`}
                appearance={{
                  elements: {
                    avatarBox: "ring-2 ring-gold/60 hover:ring-gold",
                    userButtonPopoverCard: "glass-card",
                    userButtonPopoverActionButton: "text-off-white hover:bg-white/5 hover:text-gold",
                    userButtonPopoverActionButtonText: "text-off-white",
                    userButtonPopoverFooter: "border-t border-white/10",
                  },
                  variables: {
                    colorPrimary: "#C4B454",
                    colorText: "#E3D3BD",
                    colorBackground: "#050505",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
