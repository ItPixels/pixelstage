"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Zap,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { GridBackground } from "@/components/ui/grid-background";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";

const HomePage = () => {
  const locale = useLocale();

  // Before/After images for interactive demo
  const beforeImage =
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80";
  const afterImage =
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80";

  return (
    <div className="relative min-h-screen bg-deep-black text-off-white overflow-hidden">
      {/* Animated Grid Background */}
      <GridBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-7xl mx-auto text-center space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold/20"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold">
                #1 AI Staging Platform in Dubai
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gold via-gold/90 to-gold/70 bg-clip-text text-transparent">
                Sell Dubai Properties
              </span>
              <br />
              <span className="text-off-white">3x Faster with AI Staging</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl lg:text-3xl text-off-white/80 max-w-4xl mx-auto font-light">
              Turn empty shells into luxury penthouses instantly
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-gradient-to-r from-gold to-gold/80",
                "text-deep-black font-bold text-lg px-10 py-7",
                "hover:from-gold/90 hover:to-gold/70",
                "transition-all duration-300",
                "shadow-2xl shadow-gold/30 hover:shadow-gold/40",
                "hover:scale-105",
              )}
            >
              <Link href={`/${locale}/dashboard`}>
                Start Staging for Free
                <Zap className="w-5 h-5 ms-2" />
              </Link>
            </Button>
            <p className="text-sm text-off-white/60">
              No credit card required • 5 free credits
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-off-white/60"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              <span>RERA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              <span>Used by 500+ Agents</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              <span>10-Second Renders</span>
            </div>
          </motion.div>
        </div>

        {/* Gold Glow Effect */}
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold blur-3xl" />
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="relative py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gold">
              See the Magic Happen
            </h2>
            <p className="text-lg text-off-white/70 max-w-2xl mx-auto">
              Drag the slider to see how we transform empty spaces into luxury
              interiors
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <div className="glass-card p-6 rounded-2xl border border-gold/20 shadow-2xl shadow-gold/10">
              <BeforeAfterSlider
                beforeImage={beforeImage}
                afterImage={afterImage}
                className="w-full h-[500px] md:h-[600px] rounded-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
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
              Why Real Estate Agents Choose PixelStage
            </h2>
            <p className="text-lg text-off-white/70 max-w-2xl mx-auto">
              Everything you need to stage properties faster and sell them
              quicker
            </p>
          </motion.div>

          <BentoGrid className="max-w-7xl mx-auto">
            {/* RERA Compliant - Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <BentoGridItem
                size="large"
                title="RERA Compliant"
                description="All our designs meet Dubai's Real Estate Regulatory Authority standards. Your listings are always compliant and professional."
                icon={<ShieldCheck className="w-10 h-10 text-gold" />}
                className="min-h-[350px]"
              >
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-off-white/80">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>Meets all RERA guidelines</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-off-white/80">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>Professional quality standards</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-off-white/80">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>Ready for Bayut & Property Finder</span>
                  </div>
                </div>
              </BentoGridItem>
            </motion.div>

            {/* Majlis Style - Tall Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <BentoGridItem
                size="tall"
                title="Majlis Style"
                description="Authentic Arabian Majlis designs with luxury gold accents, low seating, and panoramic Dubai skyline views. Perfect for traditional properties."
                icon={<Building2 className="w-10 h-10 text-gold" />}
              >
                <div className="mt-6 space-y-2 text-sm text-off-white/70">
                  <p>• Traditional Arabian interiors</p>
                  <p>• Luxury gold accents</p>
                  <p>• Dubai skyline integration</p>
                </div>
              </BentoGridItem>
            </motion.div>

            {/* 10-sec Render - Default Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <BentoGridItem
                size="default"
                title="10-sec Render"
                description="Lightning-fast AI generation. Get professional staging results in seconds, not hours."
                icon={<Clock className="w-10 h-10 text-gold" />}
              >
                <div className="mt-6">
                  <div className="text-3xl font-bold text-gold mb-2">
                    &lt;10s
                  </div>
                  <p className="text-sm text-off-white/70">
                    Average generation time
                  </p>
                </div>
              </BentoGridItem>
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
              Trusted by Dubai's Leading Real Estate Professionals
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-gold" />
                <span className="text-2xl font-semibold text-off-white">
                  Emaar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-gold" />
                <span className="text-2xl font-semibold text-off-white">
                  Damac
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-gold" />
                <span className="text-2xl font-semibold text-off-white">
                  Nakheel
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gold">
              Ready to Sell Properties Faster?
            </h2>
            <p className="text-xl text-off-white/80">
              Join 500+ real estate agents using AI staging to close deals 3x
              faster
            </p>
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-gradient-to-r from-gold to-gold/80",
                "text-deep-black font-bold text-lg px-10 py-7",
                "hover:from-gold/90 hover:to-gold/70",
                "transition-all duration-300",
                "shadow-2xl shadow-gold/30 hover:shadow-gold/40",
                "hover:scale-105",
              )}
            >
              <Link href={`/${locale}/dashboard`}>
                Start Staging for Free
                <Zap className="w-5 h-5 ms-2" />
              </Link>
            </Button>
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
                AI-powered virtual staging for Dubai's luxury real estate
                market. Transform empty properties into stunning listings in
                seconds.
              </p>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-off-white uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-off-white/70">
                <li>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="hover:text-gold transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/dashboard/credits`}
                    className="hover:text-gold transition-colors"
                  >
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
            © {new Date().getFullYear()} PixelStage. All rights reserved. Made
            for Dubai Real Estate.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
