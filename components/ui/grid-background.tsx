"use client";

import { motion } from "framer-motion";

/**
 * GridBackground component with slow rotation animation
 */
export function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(196, 180, 84, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196, 180, 84, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
    </div>
  );
}

