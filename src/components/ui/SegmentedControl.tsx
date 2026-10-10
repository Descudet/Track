"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center rounded-2xl bg-white/[0.06] p-1 border border-white/[0.08] backdrop-blur-md",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              onChange(option.value);
            }}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl font-medium transition-colors duration-200 select-none",
              size === "sm" ? "py-1.5 text-xs" : "py-2 text-xs sm:text-sm",
              isActive ? "text-white font-semibold" : "text-[#8e8e93] hover:text-white/80"
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-white/[0.06] text-[#8e8e93]"
                )}
              >
                {option.count}
              </span>
            )}

            {/* Active Pill Indicator */}
            {isActive && (
              <motion.div
                layoutId="segmented-control-active-pill"
                className="absolute inset-0 z-[-1] rounded-xl bg-[#E50914] shadow-[0_2px_12px_rgba(229,9,20,0.4)]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
