"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Check, Bookmark, Heart, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";
import type { WatchStatus } from "@/types/cinema";

interface PosterCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string | number;
  rating?: number; // TMDB rating 0-10 or user rating 0.5-5
  userRating?: number; // 0.5 to 5.0
  status?: WatchStatus;
  isFavorite?: boolean;
  priority?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function PosterCard({
  title,
  posterPath,
  year,
  rating,
  userRating,
  status,
  isFavorite,
  priority = false,
  onClick,
  href,
  className,
}: PosterCardProps) {
  const [hasError, setHasError] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    triggerHaptic("selection");
    if (onClick) onClick();
  };

  // Format poster image url: TMDB or fallback
  const imageUrl = posterPath && !hasError
    ? posterPath.startsWith("http")
      ? posterPath
      : `https://image.tmdb.org/t/p/w500${posterPath}`
    : null;

  const cardContent = (
    <>
      {/* 2:3 Cinema Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#141419] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
            priority={priority}
            onError={() => setHasError(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#1a1a24] to-[#0e0e13]">
            <Film className="h-6 w-6 text-white/30 mb-2" />
            <span className="text-xs font-semibold text-white/80 line-clamp-3 leading-tight">
              {title}
            </span>
            {year && (
              <span className="mt-1 text-[10px] text-[#8e8e93] font-medium">
                {year}
              </span>
            )}
          </div>
        )}

        {/* Subtle Vignette Gradient on bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* User Rating Badge (Gold) or TMDB Rating */}
          {userRating !== undefined ? (
            <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-md border border-[#f5c518]/30 shadow-sm">
              <Star className="h-3 w-3 fill-[#f5c518] text-[#f5c518]" />
              <span className="text-[11px] font-semibold text-[#f5c518]">
                {userRating.toFixed(1)}
              </span>
            </div>
          ) : rating !== undefined && rating > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-md border border-white/10">
              <Star className="h-3 w-3 fill-white/80 text-white/80" />
              <span className="text-[11px] font-medium text-white/90">
                {rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Favorite Heart Badge */}
          {isFavorite && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-[#ff3b30]/40">
              <Heart className="h-3.5 w-3.5 fill-[#ff3b30] text-[#ff3b30]" />
            </div>
          )}
        </div>

        {/* Bottom Status Pill */}
        {status && (
          <div className="absolute bottom-2 left-2">
            {status === "completed" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#30d158]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#30d158] backdrop-blur-md border border-[#30d158]/30">
                <Check className="h-2.5 w-2.5" /> Vu
              </span>
            )}
            {status === "watchlist" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#0a84ff]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#0a84ff] backdrop-blur-md border border-[#0a84ff]/30">
                <Bookmark className="h-2.5 w-2.5" /> À voir
              </span>
            )}
            {status === "watching" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#E50914]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#E50914] backdrop-blur-md border border-[#E50914]/30">
                En cours
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title & Year Metadata */}
      <div className="mt-2 flex flex-col px-0.5">
        <h4 className="line-clamp-1 text-sm font-semibold text-white/90 group-hover:text-white">
          {title}
        </h4>
        {year && (
          <span className="text-xs font-medium text-[#8e8e93]">
            {year}
          </span>
        )}
      </div>
    </>
  );

  const containerClassName = cn(
    "group relative flex flex-col cursor-pointer transition-transform duration-200 active:scale-[0.96]",
    className
  );

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className={containerClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={containerClassName}
    >
      {cardContent}
    </div>
  );
}
