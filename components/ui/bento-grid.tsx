"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

/**
 * BentoGrid component using CSS Grid with RTL/LTR support
 * Uses logical properties for spacing and positioning
 */
export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps {
  className?: string;
  header?: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  size?: "default" | "wide" | "tall" | "large";
}

/**
 * BentoGridItem component with hover animations
 * Uses logical properties (ms-, me-, ps-, pe-) for RTL/LTR support
 */
export function BentoGridItem({
  className,
  header,
  title,
  description,
  icon,
  size = "default",
}: BentoGridItemProps) {
  const sizeClasses = {
    default: "md:col-span-1 md:row-span-1",
    wide: "md:col-span-2 md:row-span-1",
    tall: "md:col-span-1 md:row-span-2",
    large: "md:col-span-2 md:row-span-2",
  };

  return (
    <motion.div
      className={cn(
        "glass-card group relative overflow-hidden",
        "flex flex-col",
        "ps-6 pe-6 pt-6 pb-6",
        sizeClasses[size],
        className,
      )}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 ms-0 me-0">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        </div>
      )}

      {/* Header */}
      {header && (
        <div className="mb-4 ms-0 me-0 text-sm text-gold/70">
          {header}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className="text-xl font-semibold mb-2 ms-0 me-0 text-white">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-sand/80 ms-0 me-0 leading-relaxed">
          {description}
        </p>
      )}

      {/* Hover gradient effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent" />
      </div>
    </motion.div>
  );
}

