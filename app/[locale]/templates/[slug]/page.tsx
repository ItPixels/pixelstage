import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Template data - can be moved to a database or CMS
const templates: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string[];
    imageUrl?: string;
    roomType: string;
    style: string;
  }
> = {
  "dubai-villa": {
    title: "Dubai Villa Interior Design - AI Virtual Staging",
    description:
      "Transform your Dubai villa with AI-powered interior design. Modern luxury, Arabic traditional, and minimalist styles available.",
    keywords: [
      "dubai villa",
      "villa interior design",
      "dubai luxury homes",
      "AI virtual staging",
    ],
    roomType: "living-room",
    style: "modern-luxury",
  },
  "majlis-design": {
    title: "Majlis Interior Design - Traditional Arabian Style",
    description:
      "Authentic Majlis design with luxury Arabian interiors, gold accents, and panoramic Dubai skyline views.",
    keywords: [
      "majlis design",
      "arabian interior",
      "traditional majlis",
      "dubai majlis",
    ],
    roomType: "majlis",
    style: "arabic-traditional",
  },
  "luxury-apartment": {
    title: "Luxury Apartment Staging - Dubai Real Estate",
    description:
      "Professional virtual staging for luxury apartments in Dubai. Increase property value with AI-powered design.",
    keywords: [
      "luxury apartment",
      "dubai apartment",
      "apartment staging",
      "virtual staging",
    ],
    roomType: "living-room",
    style: "modern-luxury",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const template = templates[slug];

  if (!template) {
    return {
      title: "Template Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pixelstage.com";
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(template.title)}`;

  return {
    title: template.title,
    description: template.description,
    keywords: template.keywords,
    openGraph: {
      title: template.title,
      description: template.description,
      url: `${baseUrl}/${locale}/templates/${slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: template.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: template.title,
      description: template.description,
      images: [ogImageUrl],
    },
  };
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const template = templates[slug];
  const isRTL = locale === "ar";

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-deep-black text-off-white">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={cn("space-y-6", isRTL && "lg:order-2")}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className="bg-gradient-to-r from-gold via-gold/90 to-gold/70 bg-clip-text text-transparent">
                  {template.title}
                </span>
              </h1>
              <p className="text-xl text-off-white/80 leading-relaxed">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "bg-gradient-to-r from-gold to-gold/80",
                    "text-deep-black font-semibold",
                    "hover:from-gold/90 hover:to-gold/70",
                  )}
                >
                  <Link href={`/${locale}/dashboard`}>
                    Start Designing
                    <ArrowRight className="w-4 h-4 ms-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className={cn(isRTL && "lg:order-1")}>
              {template.imageUrl ? (
                <div className="relative w-full h-96 lg:h-[500px] rounded-lg overflow-hidden border border-white/10">
                  <Image
                    src={template.imageUrl}
                    alt={template.title}
                    fill
                    className="object-cover"
                    loading="eager"
                    quality={90}
                  />
                </div>
              ) : (
                <div className="relative w-full h-96 lg:h-[500px] rounded-lg overflow-hidden border border-white/10 glass-card flex items-center justify-center">
                  <Sparkles className="w-24 h-24 text-gold/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gold mb-12 text-center">
            Why Choose PixelStage?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-off-white/70">
                  Advanced AI technology generates stunning interior designs in
                  seconds.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">Dubai Focused</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-off-white/70">
                  Specialized in luxury real estate staging for the Dubai market.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-gold">Instant Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-off-white/70">
                  Get professional virtual staging results in minutes, not days.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gold">
            Ready to Transform Your Property?
          </h2>
          <p className="text-xl text-off-white/70">
            Start creating stunning interior designs with AI today.
          </p>
          <Button
            asChild
            size="lg"
            className={cn(
              "bg-gradient-to-r from-gold to-gold/80",
              "text-deep-black font-semibold text-lg px-8",
              "hover:from-gold/90 hover:to-gold/70",
            )}
          >
            <Link href={`/${locale}/dashboard`}>
              Get Started Now
              <ArrowRight className="w-5 h-5 ms-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Generate static params for known templates
export async function generateStaticParams() {
  return Object.keys(templates).map((slug) => ({
    slug,
  }));
}

