"use client";

import { BentoGrid, BentoGridItem } from "./bento-grid";
import { Sparkles, Zap, Shield, Rocket, Code, Palette } from "lucide-react";

/**
 * Demo component showcasing BentoGrid usage
 */
export function BentoGridDemo() {
  return (
    <BentoGrid className="max-w-7xl mx-auto">
      <BentoGridItem
        header="Feature 1"
        title="Lightning Fast"
        description="Built with Next.js 15 and optimized for performance. Experience blazing fast page loads and smooth interactions."
        icon={<Zap className="w-8 h-8 text-gold" />}
        size="default"
      />
      <BentoGridItem
        header="Feature 2"
        title="Secure by Default"
        description="Enterprise-grade security with built-in protection against common vulnerabilities."
        icon={<Shield className="w-8 h-8 text-gold" />}
        size="tall"
      />
      <BentoGridItem
        header="Feature 3"
        title="AI Powered"
        description="Leverage the power of AI to enhance your workflow and automate repetitive tasks."
        icon={<Sparkles className="w-8 h-8 text-gold" />}
        size="default"
      />
      <BentoGridItem
        header="Feature 4"
        title="Modern Stack"
        description="Built with the latest technologies including React 19, TypeScript, and Tailwind CSS v4."
        icon={<Code className="w-8 h-8 text-gold" />}
        size="wide"
      />
      <BentoGridItem
        header="Feature 5"
        title="Beautiful Design"
        description="Carefully crafted UI components with attention to detail and modern design principles."
        icon={<Palette className="w-8 h-8 text-gold" />}
        size="default"
      />
      <BentoGridItem
        header="Feature 6"
        title="Launch Ready"
        description="Deploy to production with confidence. Everything you need to scale your application."
        icon={<Rocket className="w-8 h-8 text-gold" />}
        size="large"
      />
    </BentoGrid>
  );
}

