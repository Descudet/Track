"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Building2, Globe, Film, Tv, MapPin } from "lucide-react";
import { PosterCard } from "@/components/ui/PosterCard";
import type { TMDBCompanyRaw, TMDBSearchResultItem } from "@/types/tmdb";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";

interface StudioDetailClientProps {
  company: TMDBCompanyRaw;
  movies: TMDBSearchResultItem[];
  shows: TMDBSearchResultItem[];
}

export function StudioDetailClient({
  company,
  movies,
  shows,
}: StudioDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv">("all");

  const logoUrl = company.logo_path
    ? `https://image.tmdb.org/t/p/w500${company.logo_path}`
    : null;

  const allItems = [
    ...movies.map((m) => ({ ...m, media_type: "movie" as const })),
    ...shows.map((s) => ({ ...s, media_type: "tv" as const })),
  ].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  const displayedItems =
    activeTab === "movie"
      ? movies.map((m) => ({ ...m, media_type: "movie" as const }))
      : activeTab === "tv"
      ? shows.map((s) => ({ ...s, media_type: "tv" as const }))
      : allItems;

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

      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#181822] via-[#0d0d12] to-[#050507] px-5 pt-[calc(env(safe-area-inset-top,0px)+3.5rem)] pb-8 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Studio Logo container */}
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/[0.08] p-3 border border-white/15 backdrop-blur-xl shadow-2xl">
            {logoUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={logoUrl}
                  alt={company.name}
                  fill
                  className="object-contain filter drop-shadow-md brightness-110"
                />
              </div>
            ) : (
              <Building2 className="h-10 w-10 text-[#E50914]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
              Studio & Production
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {company.name}
            </h1>

            {/* Metadata pills */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[#8e8e93]">
              {company.origin_country && (
                <span className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 border border-white/[0.08]">
                  <span>{company.origin_country}</span>
                </span>
              )}
              {company.headquarters && (
                <span className="flex items-center gap-1.5 text-white/70">
                  <MapPin className="h-3 w-3 text-[#8e8e93]" />
                  <span>{company.headquarters}</span>
                </span>
              )}
              {company.homepage && (
                <a
                  href={company.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#0a84ff] hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  <span>Site officiel</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <p className="mt-5 text-xs text-white/80 leading-relaxed max-w-2xl">
            {company.description}
          </p>
        )}

        {/* Tab Filters */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95",
              activeTab === "all"
                ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/25"
                : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.08]"
            )}
          >
            Tout ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("movie")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95",
              activeTab === "movie"
                ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/25"
                : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.08]"
            )}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Films ({movies.length})</span>
          </button>
          {shows.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("tv")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95",
                activeTab === "tv"
                  ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/25"
                  : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.08]"
              )}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Séries ({shows.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Media Catalog Grid */}
      <main className="px-5 pt-6">
        {displayedItems.length === 0 ? (
          <div className="py-20 text-center text-sm text-[#8e8e93]">
            Aucune œuvre disponible pour cette catégorie.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
            {displayedItems.map((item) => {
              const isMovie = item.media_type === "movie";
              const title = item.title || item.name || "Titre inconnu";
              const year = (item.release_date || item.first_air_date)?.split("-")[0];

              return (
                <PosterCard
                  key={`${item.media_type}_${item.id}`}
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
