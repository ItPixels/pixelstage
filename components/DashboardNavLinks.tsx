"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Images,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

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

export const DashboardNavLinks = ({
  onNavigate,
}: {
  onNavigate?: () => void;
}) => {
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

