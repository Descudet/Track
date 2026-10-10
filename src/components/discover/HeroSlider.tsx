"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Bookmark,
  Star,
  ChevronLeft,
  ChevronRight,
  Info,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";
import type { TMDBSearchResultItem } from "@/types/tmdb";
import type { WatchStatus } from "@/types/cinema";

interface HeroSliderProps {
  items: TMDBSearchResultItem[];
  userStates: Record<
    number,
    {
      status?: WatchStatus;
      userRating?: number;
      isFavorite?: boolean;
    }
  >;
  onToggleWatch: (item: TMDBSearchResultItem) => void;
  onToggleWatchlist: (item: TMDBSearchResultItem) => void;
  onOpenRate: (item: TMDBSearchResultItem) => void;
}

export function HeroSlider({
  items,
  userStates,
  onToggleWatch,
  onToggleWatchlist,
  onOpenRate,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [logoErrors, setLogoErrors] = useState<Record<number, boolean>>({});

  const total = items.length;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, 5000);
    }
  }, [total]);

  // Défilement automatique toutes les 5 secondes
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handleNext = () => {
    triggerHaptic("selection");
    resetTimer();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    triggerHaptic("selection");
    resetTimer();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleDotClick = (index: number) => {
    triggerHaptic("selection");
    resetTimer();
    setCurrentIndex(index);
  };

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (touchDeltaX < -45 && total > 1) {
      handleNext();
    } else if (touchDeltaX > 45 && total > 1) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  if (total === 0) return null;

  return (
    <section
      aria-label="À l'affiche"
      className="relative w-full overflow-hidden bg-[#050507]"
    >
      {/* Sliding Track */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {items.map((item, idx) => {
          const mediaType = (item.media_type as "movie" | "tv") || "movie";
          const title = item.title || item.name || "À l'affiche";
          const releaseDate = item.release_date || item.first_air_date;
          const year = releaseDate ? releaseDate.split("-")[0] : undefined;
          const state = userStates[item.id] || {};
          const isWatched = state.status === "completed";
          const isInWatchlist = state.status === "watchlist";
          const userRating = state.userRating;

          const backdropUrl = item.backdrop_path
            ? item.backdrop_path.startsWith("http")
              ? item.backdrop_path
              : `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
            : null;

          const logoUrl =
            item.logo_path && !logoErrors[item.id]
              ? item.logo_path.startsWith("http")
                ? item.logo_path
                : `https://image.tmdb.org/t/p/w500${item.logo_path}`
              : null;

          const detailHref = mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;

          return (
            <div
              key={item.id}
              className="relative w-full min-w-full shrink-0 overflow-hidden bg-[#050507]"
            >
              {/* Backdrop Container */}
              <div className="relative h-[290px] sm:h-[400px] w-full overflow-hidden">
                {backdropUrl ? (
                  <Image
                    src={backdropUrl}
                    alt={title}
                    fill
                    priority={idx === 0}
                    loading={idx < 2 ? "eager" : "lazy"}
                    sizes="100vw"
                    className="object-cover object-top opacity-100"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#1a1829] to-[#0a0a0e]" />
                )}

                {/* Softened Top Vignette */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Softened Bottom Fade for high visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 via-30% to-transparent pointer-events-none" />
              </div>

              {/* Hero Content Overlay (lifted higher over backdrop) */}
              <div className="relative -mt-44 sm:-mt-52 px-5 pb-3 z-10">
                {/* Metadata Row */}
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#8e8e93]">
                  {year && <span>{year}</span>}
                  <span className="text-white/20">•</span>
                  <span className="capitalize">{mediaType === "tv" ? "Série" : "Film"}</span>
                  {item.vote_average ? (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="inline-flex items-center gap-1 text-[#f5c518] font-bold">
                        ★ {item.vote_average.toFixed(1)}
                      </span>
                    </>
                  ) : null}
                  {state.isFavorite && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ff3b30]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ff3b30] border border-[#ff3b30]/30">
                      <Heart className="h-2.5 w-2.5 fill-current" /> Favori
                    </span>
                  )}
                </div>

                {/* Clickable Logo or Title */}
                <Link
                  href={detailHref}
                  onClick={() => triggerHaptic("selection")}
                  className="block group"
                >
                  {logoUrl ? (
                    <div className="relative my-1.5 h-14 sm:h-20 w-full max-w-[240px] sm:max-w-[340px]">
                      <Image
                        src={logoUrl}
                        alt={title}
                        fill
                        priority={idx === 0}
                        className="object-contain object-left filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] brightness-110 group-hover:scale-[1.02] transition-transform"
                        onError={() =>
                          setLogoErrors((prev) => ({ ...prev, [item.id]: true }))
                        }
                      />
                    </div>
                  ) : (
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md group-hover:text-[#E50914] transition-colors">
                      {title}
                    </h1>
                  )}
                </Link>

                {/* Tagline / Overview */}
                {item.overview && (
                  <p className="mt-1 text-xs sm:text-sm italic text-white/70 line-clamp-2 max-w-xl">
                    « {item.overview.slice(0, 110)}... »
                  </p>
                )}

                {/* Action Buttons Row */}
                <div className="mt-3 sm:mt-4 flex flex-nowrap items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 whitespace-nowrap relative z-20">
                  {/* Vu Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatch(item);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 shadow-md touch-manipulation cursor-pointer",
                      isWatched
                        ? "bg-[#30d158] text-black border border-[#30d158]"
                        : "bg-white/[0.1] text-white border border-white/[0.15] hover:bg-white/[0.15]"
                    )}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                    <span>
                      {isWatched ? (
                        "Vu"
                      ) : (
                        <>
                          <span className="hidden sm:inline">Marquer vu</span>
                          <span className="sm:hidden">Vu</span>
                        </>
                      )}
                    </span>
                  </button>

                  {/* Noter Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRate(item);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 shadow-md touch-manipulation cursor-pointer",
                      userRating !== undefined
                        ? "bg-[#f5c518] text-black border border-[#f5c518]"
                        : "bg-white/[0.1] text-white border border-white/[0.15] hover:bg-white/[0.15]"
                    )}
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5 stroke-[2.5] shrink-0",
                        userRating !== undefined && "fill-current"
                      )}
                    />
                    <span>
                      {userRating !== undefined ? `${userRating.toFixed(1)} ★` : "Noter"}
                    </span>
                  </button>

                  {/* Watchlist Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(item);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 shadow-md touch-manipulation cursor-pointer",
                      isInWatchlist
                        ? "bg-[#0a84ff] text-white border border-[#0a84ff]"
                        : "bg-white/[0.1] text-white border border-white/[0.15] hover:bg-white/[0.15]"
                    )}
                  >
                    <Bookmark className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {isInWatchlist ? (
                        <>
                          <span className="hidden sm:inline">Dans ma liste</span>
                          <span className="sm:hidden">Liste</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">+ Watchlist</span>
                          <span className="sm:hidden">+ Liste</span>
                        </>
                      )}
                    </span>
                  </button>

                  {/* Details Link */}
                  <Link
                    href={detailHref}
                    onClick={() => triggerHaptic("selection")}
                    className="flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full bg-white/[0.08] px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-white/90 border border-white/[0.12] backdrop-blur-md hover:bg-white/[0.14] active:scale-95 touch-manipulation"
                  >
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>Fiche</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Prev / Next Nav Buttons */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute left-4 top-1/3 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white active:scale-90 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-4 top-1/3 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white active:scale-90 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Interactive Pager Dots Indicator */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 z-20 relative">
          {items.map((item, idx) => (
            <button
              key={`hero-dot-${item.id}`}
              type="button"
              onClick={() => handleDotClick(idx)}
              className={cn(
                "h-2 w-2 rounded-full aspect-square shrink-0 transition-all duration-300 cursor-pointer touch-manipulation",
                idx === currentIndex
                  ? "bg-[#E50914] scale-125 shadow-[0_0_8px_rgba(229,9,20,0.6)]"
                  : "bg-white/30 hover:bg-white/60"
              )}
              aria-label={`Aller au média ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
