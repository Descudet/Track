"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";

interface RatingStarsProps {
  value: number; // 0.0 to 5.0
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  0.5: "Médiocre",
  1.0: "Très décevant",
  1.5: "Faible",
  2.0: "Moyen",
  2.5: "Correct",
  3.0: "Bien",
  3.5: "Très bien",
  4.0: "Excellent",
  4.5: "Remarquable",
  5.0: "Chef-d'œuvre",
};

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = false,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const starSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-9 w-9",
  };

  const handlePointer = (starIndex: number, isHalf: boolean) => {
    if (readOnly || !onChange) return;
    const calculated = starIndex + (isHalf ? 0.5 : 1.0);
    if (calculated === 5.0) {
      triggerHaptic("success");
    } else {
      triggerHaptic("light");
    }
    onChange(calculated);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 5 Stars row */}
      <div
        className={cn(
          "inline-flex items-center gap-1.5 touch-manipulation",
          !readOnly && "cursor-pointer"
        )}
        onMouseLeave={() => !readOnly && setHoverValue(null)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const currentStarVal = displayValue - starIndex;
          const isFull = currentStarVal >= 1.0;
          const isHalf = currentStarVal >= 0.5 && currentStarVal < 1.0;

          return (
            <div
              key={starIndex}
              className={cn(
                "relative transition-transform duration-150 select-none",
                !readOnly && "active:scale-125 hover:scale-110"
              )}
            >
              {/* Star Background (Dark Empty Outline) */}
              <Star
                className={cn(
                  starSizes[size],
                  "text-white/20 transition-colors"
                )}
                strokeWidth={1.5}
              />

              {/* Half or Full Star Overlay */}
              {(isFull || isHalf) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isFull ? "100%" : "50%" }}
                >
                  <Star
                    className={cn(
                      starSizes[size],
                      "fill-[#f5c518] text-[#f5c518] drop-shadow-[0_0_8px_rgba(245,197,24,0.45)]"
                    )}
                    strokeWidth={1.5}
                  />
                </div>
              )}

              {/* Interactive Left/Right Hitboxes for Thumb Tap/Hover */}
              {!readOnly && (
                <div className="absolute inset-0 flex">
                  {/* Left Half (e.g. 0.5) */}
                  <button
                    type="button"
                    aria-label={`Noter ${starIndex + 0.5} étoiles`}
                    className="h-full w-1/2 cursor-pointer opacity-0"
                    onMouseEnter={() => setHoverValue(starIndex + 0.5)}
                    onClick={() => handlePointer(starIndex, true)}
                  />
                  {/* Right Half (e.g. 1.0) */}
                  <button
                    type="button"
                    aria-label={`Noter ${starIndex + 1.0} étoiles`}
                    className="h-full w-1/2 cursor-pointer opacity-0"
                    onMouseEnter={() => setHoverValue(starIndex + 1.0)}
                    onClick={() => handlePointer(starIndex, false)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Numerical Badge & Human Emotion Label */}
      {showLabel && (
        <div className="flex items-center gap-1.5 text-center">
          <span className="font-semibold text-sm text-[#f5c518]">
            {displayValue > 0 ? `${displayValue.toFixed(1)} / 5` : "Pas encore noté"}
          </span>
          {displayValue > 0 && RATING_LABELS[displayValue] && (
            <>
              <span className="text-white/30 text-xs">•</span>
              <span className="text-xs font-medium text-white/70">
                {RATING_LABELS[displayValue]}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
