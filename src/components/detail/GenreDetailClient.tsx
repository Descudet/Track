"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Film, Tv, Sparkles, Flame, Star } from "lucide-react";
import { PosterCard } from "@/components/ui/PosterCard";
import type { TMDBSearchResultItem } from "@/types/tmdb";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";

interface GenreDetailClientProps {
  genreId: number;
  genreName: string;
  initialMediaType?: "movie" | "tv";
  movies: TMDBSearchResultItem[];
  shows: TMDBSearchResultItem[];
}

export function GenreDetailClient({
  genreId,
  genreName,
  initialMediaType = "movie",
  movies,
  shows,
}: GenreDetailClientProps) {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<"movie" | "tv">(initialMediaType);
  const [sortBy, setSortBy] = useState<"popularity" | "rating">("popularity");

  const rawList = mediaType === "movie" ? movies : shows;

  const sortedList = [...rawList].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    }
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });

  return (
    <div className="relative min-h-screen bg-[#050507] text-white pb-28">
      {/* Top Floating iOS Back Button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              router.push("/");
            }
          }}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white active:scale-90 transition-transform shadow-lg touch-manipulation cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5] -ml-0.5" />
        </button>
      </div>

      {/* Header Banner */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#181822] via-[#0d0d12] to-[#050507] px-5 pt-[calc(env(safe-area-inset-top,0px)+3.5rem)] pb-8 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-[#E50914]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
            Genre Cinématographique
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">
          {genreName}
        </h1>

        <p className="mt-1 text-xs text-[#8e8e93]">
          Explorez les meilleurs titres du genre {genreName.toLowerCase()}
        </p>

        {/* Format Switcher & Sorter */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {/* Format Tabs (Films / Séries) */}
          <div className="flex rounded-full bg-white/[0.06] p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setMediaType("movie")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95",
                mediaType === "movie"
                  ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/25"
                  : "text-[#8e8e93] hover:text-white"
              )}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Films ({movies.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("tv")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95",
                mediaType === "tv"
                  ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/25"
                  : "text-[#8e8e93] hover:text-white"
              )}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Séries ({shows.length})</span>
            </button>
          </div>

          {/* Sorter Selector */}
          <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setSortBy("popularity")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                sortBy === "popularity"
                  ? "bg-white/15 text-white"
                  : "text-[#8e8e93] hover:text-white"
              )}
            >
              <Flame className="h-3 w-3 text-[#ff9500]" />
              <span>Populaires</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy("rating")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                sortBy === "rating"
                  ? "bg-white/15 text-white"
                  : "text-[#8e8e93] hover:text-white"
              )}
            >
              <Star className="h-3 w-3 text-[#f5c518]" />
              <span>Mieux notés</span>
            </button>
          </div>
        </div>
      </header>

      {/* Media Catalog Grid */}
      <main className="px-5 pt-6">
        {sortedList.length === 0 ? (
          <div className="py-20 text-center text-sm text-[#8e8e93]">
            Aucun titre disponible dans cette catégorie.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
            {sortedList.map((item) => {
              const isMovie = mediaType === "movie";
              const title = item.title || item.name || "Titre inconnu";
              const year = (item.release_date || item.first_air_date)?.split("-")[0];

              return (
                <PosterCard
                  key={`${mediaType}_${item.id}`}
                  id={item.id}
                  title={title}
                  posterPath={item.poster_path ?? null}
                  year={year}
                  rating={item.vote_average}
                  href={isMovie ? `/movie/${item.id}` : `/tv/${item.id}`}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
