"use client";

import React from "react";
import Image from "next/image";
import { Play, Check, Bookmark, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackdropHeroProps {
  title: string;
  logoPath?: string | null;
  backdropPath: string | null;
  tagline?: string;
  year?: string | number;
  runtime?: number; // in minutes
  genres?: string[];
  isWatched?: boolean;
  isInWatchlist?: boolean;
  isFavorite?: boolean;
  userRating?: number;
  onToggleWatch?: () => void;
  onToggleWatchlist?: () => void;
  onOpenRate?: () => void;
  onPlayTrailer?: () => void;
}

export function BackdropHero({
  title,
  logoPath,
  backdropPath,
  tagline,
  year,
  runtime,
  genres = [],
  isWatched = false,
  isInWatchlist = false,
  isFavorite = false,
  userRating,
  onToggleWatch,
  onToggleWatchlist,
  onOpenRate,
  onPlayTrailer,
}: BackdropHeroProps) {
  const [logoError, setLogoError] = React.useState(false);
  const [offsetY, setOffsetY] = React.useState(0);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    setLogoError(false);
  }, [logoPath]);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 0) {
          setOffsetY(y * 0.35);
          setScale(1);
        } else {
          setOffsetY(0);
          setScale(1 + Math.abs(y) * 0.002);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const logoUrl = logoPath
    ? logoPath.startsWith("http")
      ? logoPath
      : `https://image.tmdb.org/t/p/w500${logoPath}`
    : null;

  const imageUrl = backdropPath
    ? backdropPath.startsWith("http")
      ? backdropPath
      : `https://image.tmdb.org/t/p/w1280${backdropPath}`
    : null;

  const formattedRuntime = runtime
    ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
    : null;

  return (
    <div className="relative w-full overflow-hidden bg-[#050507]">
      {/* Backdrop Image Container with Parallax */}
      <div className="relative h-[290px] sm:h-[400px] w-full overflow-hidden">
        <div
          className="absolute inset-0 h-full w-full will-change-transform"
          style={{
            transform: `translate3d(0, ${offsetY}px, 0) scale(${scale})`,
            transformOrigin: "center top",
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-100"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1a1829] to-[#0a0a0e]" />
          )}
        </div>

        {/* Top Vignette (softened for bright legible backdrop) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Bottom Smooth OLED Fade to #050507 (reduced darkness veil) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 via-30% to-transparent pointer-events-none" />
      </div>

      {/* Hero Content overlay - pulled higher over the backdrop */}
      <div className="relative -mt-44 sm:-mt-52 px-5 pb-3 z-10">
        {/* Metadata row */}
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#8e8e93]">
          {year && <span>{year}</span>}
          {formattedRuntime && (
            <>
              <span className="text-white/20">•</span>
              <span>{formattedRuntime}</span>
            </>
          )}
          {genres.length > 0 && (
            <>
              <span className="text-white/20">•</span>
              <span className="text-white/80">{genres.slice(0, 2).join(", ")}</span>
            </>
          )}
          {isFavorite && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ff3b30]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ff3b30] border border-[#ff3b30]/30">
              <Heart className="h-2.5 w-2.5 fill-current" /> Favori
            </span>
          )}
        </div>

        {/* Big Cinematic Title or Official Logo */}
        {logoUrl && !logoError ? (
          <div className="relative my-1.5 h-14 sm:h-20 w-full max-w-[240px] sm:max-w-[340px]">
            <Image
              src={logoUrl}
              alt={title}
              fill
              priority
              className="object-contain object-left filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] brightness-110"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            {title}
          </h1>
        )}

        {tagline && (
          <p className="mt-1 text-xs sm:text-sm italic text-white/70 line-clamp-2 max-w-xl">
            « {tagline} »
          </p>
        )}

        {/* Action Buttons Row */}
        <div className="mt-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {/* Quick "Vu" button */}
          <button
            type="button"
            onClick={onToggleWatch}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 shadow-md",
              isWatched
                ? "bg-[#30d158] text-black border border-[#30d158]"
                : "bg-white/[0.1] text-white border border-white/[0.15] hover:bg-white/[0.15]"
            )}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{isWatched ? "Vu" : "Marquer vu"}</span>
          </button>

          {/* Quick "Noter" button */}
          <button
            type="button"
            onClick={onOpenRate}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 shadow-md",
              userRating !== undefined
                ? "bg-[#f5c518] text-black border border-[#f5c518]"
                : "bg-white/[0.1] text-white border border-white/[0.15] hover:bg-white/[0.15]"
            )}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5 stroke-[2.5]",
                userRating !== undefined && "fill-current"
              )}
            />
            <span>
              {userRating !== undefined ? `${userRating.toFixed(1)} ★` : "Noter"}
            </span>
          </button>

          {/* Quick "Watchlist" button */}
          <button
            type="button"
            onClick={onToggleWatchlist}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 shadow-md",
              isInWatchlist
                ? "bg-[#0a84ff] text-white border border-[#0a84ff]"
                : "bg-white/[0.1] text-white border border-white/[0.15] hover:bg-white/[0.15]"
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{isInWatchlist ? "Dans ma liste" : "+ Watchlist"}</span>
          </button>

          {/* Trailer Button */}
          {onPlayTrailer && (
            <button
              type="button"
              onClick={onPlayTrailer}
              className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-2.5 text-xs font-semibold text-white/90 border border-white/[0.12] backdrop-blur-md hover:bg-white/[0.14] active:scale-95"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Trailer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
