import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { Toaster } from "sonner";
import "../globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

/**
 * Generate SEO metadata with dynamic Open Graph images
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pixelstage.com";
  const isArabic = locale === "ar";

  const title = "PixelStage - AI Real Estate Staging Dubai";
  const description = isArabic
    ? "منصة PixelStage الرائدة في دبي لتزيين العقارات بالذكاء الاصطناعي. حوّل المساحات الفارغة إلى قوائم فاخرة في ثوانٍ."
    : "Transform empty properties into stunning, fully-furnished spaces with AI. Dubai's #1 virtual staging platform for luxury real estate.";

  // Dynamic OG image URL (can be customized per page)
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    keywords: [
      "AI interior design",
      "virtual staging Dubai",
      "real estate staging",
      "luxury interior design",
      "Dubai property staging",
      "AI real estate",
    ],
    authors: [{ name: "PixelStage" }],
    creator: "PixelStage",
    publisher: "PixelStage",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
    openGraph: {
      type: "website",
      locale: isArabic ? "ar_AE" : "en_AE",
      url: `${baseUrl}/${locale}`,
      title,
      description,
      siteName: "PixelStage",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@pixelstage",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add your verification codes here
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
    },
  };
}

/**
 * Get direction and font class based on locale
 */
function getLocaleConfig(locale: string) {
  const isRTL = locale === "ar";
  return {
    dir: isRTL ? "rtl" : "ltr",
    fontClass: isRTL ? tajawal.variable : inter.variable,
    lang: locale,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();

  // Get locale-specific configuration
  const { dir, fontClass, lang } = getLocaleConfig(locale);

  return (
    <ClerkProvider>
      <html lang={lang} dir={dir} className="dark" suppressHydrationWarning>
        <body
          className={`${fontClass} ${inter.variable} ${tajawal.variable} antialiased`}
        >
          <NextIntlClientProvider messages={messages}>
            <Navbar />
            {children}
            <Toaster theme="dark" position="top-right" />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
