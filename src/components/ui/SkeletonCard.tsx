"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("flex flex-col gap-2 animate-pulse", className)}>
      {/* 2:3 Poster placeholder with shimmer */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white/[0.05] border border-white/[0.05]">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-[shimmer_1.6s_infinite]" />
      </div>
      {/* Title placeholder */}
      <div className="h-3.5 w-4/5 rounded-md bg-white/[0.08]" />
      {/* Subtitle placeholder */}
      <div className="h-2.5 w-1/2 rounded-md bg-white/[0.04]" />
    </div>
  );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-3.5 overflow-hidden px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-32 shrink-0">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
