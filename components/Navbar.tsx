"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

const Navbar = (): JSX.Element => {
  return (
    <nav className="sticky top-0 z-30 w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-12">
        <Link
          href="/"
          className="text-lg font-semibold text-white transition hover:text-emerald-300"
        >
          PixelStage
        </Link>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Button
              asChild
              size="sm"
              className="bg-white text-black transition hover:bg-zinc-100"
            >
              <Link href="/sign-in">Войти</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "ring-2 ring-emerald-400/60",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

