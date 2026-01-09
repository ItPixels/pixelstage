"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Language switcher component that changes the locale segment in URL
 * while preserving the current path
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      return; // Already on this locale
    }

    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, "");

    // Construct new path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale || ""}`;

    // Navigate to new path
    router.push(newPath);
  };

  const localeNames: Record<Locale, string> = {
    en: "English",
    ar: "العربية",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Globe className="w-4 h-4 text-gold" />
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="bg-midnight border border-gold/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}

