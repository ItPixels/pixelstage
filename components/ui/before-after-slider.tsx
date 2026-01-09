"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

/**
 * Before/After image slider component
 */
export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  className,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div
      className={cn("relative w-full h-64 md:h-80 rounded-lg overflow-hidden cursor-col-resize", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSliderPosition(50)}
    >
      {/* Before Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${beforeImage})` }}
        />
      </div>

      {/* After Image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${afterImage})` }}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-gold z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gold border-2 border-deep-black flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-deep-black" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 start-4 px-3 py-1.5 glass-panel rounded text-xs font-medium text-off-white">
        Before
      </div>
      <div className="absolute top-4 end-4 px-3 py-1.5 glass-panel rounded text-xs font-medium text-off-white">
        After
      </div>
    </div>
  );
}

