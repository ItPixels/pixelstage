"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Images,
  Menu,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Генератор", href: "/dashboard/generator", icon: Sparkles },
  { label: "Галерея", href: "/dashboard/gallery", icon: Images },
  { label: "Купить кредиты", href: "/dashboard/credits", icon: CreditCard },
  { label: "Профиль", href: "/dashboard/profile", icon: User },
];

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
              "hover:bg-white/5 hover:text-white",
              isActive
                ? "bg-white/5 text-white ring-1 ring-emerald-400/40"
                : "text-zinc-300",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition",
                isActive ? "text-emerald-300" : "text-zinc-400",
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export const DashboardSidebar = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="flex w-full flex-col gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-white transition hover:text-emerald-300"
          >
            PixelStage
          </Link>
          <NavLinks />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
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
              <NavLinks />
            </SheetContent>
          </Sheet>
        </header>
      </div>
    </div>
  );
};

