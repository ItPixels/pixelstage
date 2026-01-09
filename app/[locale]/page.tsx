"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Building2, Download, Sparkles, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { GridBackground } from "@/components/ui/grid-background";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";

const HomePage = () => {
  const locale = useLocale();
  
  // Placeholder images for before/after
  const beforeImage = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
  const afterImage = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";

  return (
    <div className="relative min-h-screen bg-deep-black text-off-white overflow-hidden">
      {/* Grid Background */}
      <GridBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-7xl mx-auto text-center space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gold via-gold/90 to-gold/70 bg-clip-text text-transparent">
                Redefine Luxury Real Estate
              </span>
              <br />
              <span className="text-off-white">with AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-off-white/80 max-w-3xl mx-auto">
              Turn empty shells into multi-million dirham listings in seconds
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-gradient-to-r from-gold to-gold/80",
                "text-deep-black font-semibold text-lg px-8 py-6",
                "hover:from-gold/90 hover:to-gold/70",
                "transition-all duration-300",
                "shadow-lg shadow-gold/20 hover:shadow-gold/30"
              )}
            >
              <Link href={`/${locale}/dashboard`}>
                Start Designing
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Why PixelStage Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gold">
              Why PixelStage?
            </h2>
            <p className="text-lg text-off-white/70 max-w-2xl mx-auto">
              Professional virtual staging powered by AI, designed for Dubai's luxury real estate market
            </p>
          </motion.div>

          <BentoGrid className="max-w-7xl mx-auto">
            {/* Large Card - Before/After Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <BentoGridItem
                size="large"
                title="Instant Virtual Staging"
                description="Transform empty properties into stunning, fully-furnished spaces. See the dramatic difference with our interactive before/after comparison."
                icon={<Sparkles className="w-8 h-8 text-gold" />}
                className="min-h-[400px]"
              >
                <div className="mt-6">
                  <BeforeAfterSlider
                    beforeImage={beforeImage}
                    afterImage={afterImage}
                    className="w-full"
                  />
                </div>
              </BentoGridItem>
            </motion.div>

            {/* Dubai Style Presets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <BentoGridItem
                size="tall"
                title="Dubai Style Presets"
                description="Pre-configured design styles tailored for Dubai's luxury market. From modern minimalism to opulent Arabic-inspired interiors."
                icon={<TreePine className="w-8 h-8 text-gold" />}
              />
            </motion.div>

            {/* Export for Platforms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <BentoGridItem
                size="default"
                title="Export for Bayut & Property Finder"
                description="One-click export optimized for Dubai's leading property platforms. Perfect dimensions, formats, and quality."
                icon={<Download className="w-8 h-8 text-gold" />}
              />
            </motion.div>
          </BentoGrid>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-sm uppercase tracking-wider text-gold/70 mb-8">
              Trusted by Dubai's Leading Developers
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
              {/* Placeholder logos */}
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-gold" />
                <span className="text-2xl font-semibold text-off-white">Emaar</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-gold" />
                <span className="text-2xl font-semibold text-off-white">Damac</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-gold" />
                <span className="text-2xl font-semibold text-off-white">Nakheel</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gold">PixelStage</h3>
              <p className="text-sm text-off-white/70">
                AI-powered interior design for Dubai's luxury real estate market
              </p>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-off-white uppercase tracking-wider">
                Links
              </h4>
              <ul className="space-y-2 text-sm text-off-white/70">
                <li>
                  <Link href={`/${locale}/dashboard`} className="hover:text-gold transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/dashboard/credits`} className="hover:text-gold transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-gold transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gold transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Language Switcher */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-off-white uppercase tracking-wider">
                Language
              </h4>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-white/10 text-center text-sm text-off-white/50">
            © {new Date().getFullYear()} PixelStage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
