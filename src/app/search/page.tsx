"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search as SearchIcon,
  X,
  Film,
  Tv,
  Users,
  Sparkles,
  Flame,
  Star,
  Calendar,
  Check,
  SlidersHorizontal,
  Building2,
} from "lucide-react";
import { PosterCard } from "@/components/ui/PosterCard";
import { BottomNavBar } from "@/components/ui/BottomNavBar";
import { RatingSheet } from "@/components/ui/RatingSheet";
import { SkeletonRow } from "@/components/ui/SkeletonCard";
import { cn } from "@/lib/utils";
import type { TMDBSearchResultItem } from "@/types/tmdb";

const POPULAR_GENRES = [
  { id: 28, name: "Action" },
  { id: 878, name: "Science-Fiction" },
  { id: 53, name: "Thriller" },
  { id: 18, name: "Drame" },
  { id: 35, name: "Comédie" },
  { id: 16, name: "Animation" },
  { id: 27, name: "Horreur" },
  { id: 14, name: "Fantastique" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentaire" },
];

const POPULAR_STUDIOS = [
  { id: 41077, name: "A24" },
  { id: 174, name: "Warner Bros." },
  { id: 2, name: "Walt Disney Pictures" },
  { id: 10342, name: "Studio Ghibli" },
  { id: 3268, name: "HBO" },
  { id: 420, name: "Marvel Studios" },
  { id: 33, name: "Universal Pictures" },
  { id: 7, name: "DreamWorks Animation" },
  { id: 56, name: "Lucasfilm" },
];

type CategoryFilter = "all" | "movie" | "tv" | "person";
type SortOption = "popularity" | "rating" | "date";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [hideNoPoster, setHideNoPoster] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    movies: TMDBSearchResultItem[];
    tvShows: TMDBSearchResultItem[];
    people: TMDBSearchResultItem[];
  }>({
    movies: [],
    tvShows: [],
    people: [],
  });

  // Rating sheet state
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [activeMediaToRate, setActiveMediaToRate] = useState<{
    id: number;
    title: string;
    posterPath: string | null;
    year?: string;
  } | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when debounced query, sortBy, or hideNoPoster changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ movies: [], tvShows: [], people: [] });
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const params = new URLSearchParams({
      q: debouncedQuery,
      sortBy,
      hideNoPoster: String(hideNoPoster),
    });

    fetch(`/api/tmdb/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setResults({
            movies: data.movies || [],
            tvShows: data.tvShows || [],
            people: data.people || [],
          });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Search error:", err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, sortBy, hideNoPoster]);

  const hasResults =
    results.movies.length > 0 ||
    results.tvShows.length > 0 ||
    results.people.length > 0;

  return (
    <div className="relative min-h-screen bg-[#050507] text-white pb-28">
      {/* iOS Search Bar Header (Spotlight style) */}
      <header className="sticky top-0 z-30 bg-[#050507]/90 px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e8e93]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Films, séries, acteurs, réalisateurs..."
                className="h-11 w-full rounded-2xl bg-white/[0.08] pl-10 pr-10 text-base text-white placeholder-[#8e8e93] border border-white/[0.08] focus:border-[#E50914]/50 focus:bg-white/[0.12] focus:outline-none transition-all shadow-inner"
                autoComplete="off"
                autoCorrect="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filters & Sorting Toolbar (when query is active or results are displayed) */}
          {debouncedQuery && (
            <div className="flex flex-col gap-2 pt-1 animate-fadeIn">
              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-all active:scale-95",
                    categoryFilter === "all"
                      ? "bg-white text-black shadow-sm"
                      : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.06]"
                  )}
                >
                  Tout
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("movie")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-all active:scale-95",
                    categoryFilter === "movie"
                      ? "bg-[#E50914] text-white shadow-sm shadow-[#E50914]/25"
                      : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.06]"
                  )}
                >
                  Films ({results.movies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("tv")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-all active:scale-95",
                    categoryFilter === "tv"
                      ? "bg-[#0a84ff] text-white shadow-sm"
                      : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.06]"
                  )}
                >
                  Séries ({results.tvShows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("person")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-all active:scale-95",
                    categoryFilter === "person"
                      ? "bg-[#30d158] text-black shadow-sm"
                      : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.06]"
                  )}
                >
                  Personnes ({results.people.length})
                </button>
              </div>

              {/* Sorting & Quality Filter Row */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-[11px] pt-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[#8e8e93] font-medium flex items-center gap-1">
                    <SlidersHorizontal className="h-3 w-3" /> Tri :
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortBy("popularity")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all",
                      sortBy === "popularity"
                        ? "bg-white/20 text-white"
                        : "text-[#8e8e93] hover:text-white/80"
                    )}
                  >
                    <Flame className="h-3 w-3 text-[#ff9f0a]" /> Populaire
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("rating")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all",
                      sortBy === "rating"
                        ? "bg-white/20 text-white"
                        : "text-[#8e8e93] hover:text-white/80"
                    )}
                  >
                    <Star className="h-3 w-3 text-[#f5c518]" /> Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("date")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all",
                      sortBy === "date"
                        ? "bg-white/20 text-white"
                        : "text-[#8e8e93] hover:text-white/80"
                    )}
                  >
                    <Calendar className="h-3 w-3 text-[#0a84ff]" /> Récents
                  </button>
                </div>

                {/* Hide without poster toggle */}
                <button
                  type="button"
                  onClick={() => setHideNoPoster(!hideNoPoster)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium shrink-0 transition-all border",
                    hideNoPoster
                      ? "bg-[#30d158]/10 text-[#30d158] border-[#30d158]/30"
                      : "bg-white/[0.04] text-[#8e8e93] border-white/[0.08]"
                  )}
                >
                  <Check className={cn("h-3 w-3", !hideNoPoster && "opacity-30")} />
                  <span>Avec affiche</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 pt-4">
        {/* State 1: Loading Indicator */}
        {isLoading && (
          <div className="py-6">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-white/40">
              Recherche en cours...
            </span>
            <SkeletonRow count={4} />
          </div>
        )}

        {/* State 2: Default Discovery (When search query is empty) */}
        {!debouncedQuery && !isLoading && (
          <div className="flex flex-col gap-8 py-2">
            {/* Quick Explore by Genre */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E50914]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">
                  Explorer par Genre
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_GENRES.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/genre/${genre.id}?name=${encodeURIComponent(genre.name)}`}
                    className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.08] hover:bg-white/[0.12] hover:text-white transition-all active:scale-95"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick Explore by Studio */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0a84ff]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">
                  Studios & Production
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_STUDIOS.map((studio) => (
                  <Link
                    key={studio.id}
                    href={`/studio/${studio.id}`}
                    className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.08] hover:bg-white/[0.12] hover:text-white transition-all active:scale-95"
                  >
                    {studio.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick Tip Card */}
            <section className="rounded-3xl bg-gradient-to-br from-[#121217] to-[#0a0a0d] p-5 border border-white/[0.08] shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
                Recherche Intelligente
              </span>
              <h3 className="mt-1 text-base font-bold text-white">
                Filtrez et triez la base cinématographique
              </h3>
              <p className="mt-1 text-xs text-[#8e8e93] leading-relaxed">
                Les résultats sont automatiquement épurés du bruit et des contenus sans affiche. Vous pouvez trier par popularité, note ou date de sortie directement depuis la barre d'outils.
              </p>
            </section>
          </div>
        )}

        {/* State 3: Search Results Grouped */}
        {debouncedQuery && !isLoading && (
          <div className="flex flex-col gap-8 py-2">
            {/* Section: Films */}
            {(categoryFilter === "all" || categoryFilter === "movie") &&
              results.movies.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-[#E50914]" />
                    <h2 className="text-base font-bold text-white">
                      Films ({results.movies.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
                    {results.movies.map((item) => (
                      <PosterCard
                        key={`movie-${item.id}`}
                        id={item.id}
                        title={item.title || item.original_title || "Sans titre"}
                        posterPath={item.poster_path || null}
                        year={item.release_date ? item.release_date.split("-")[0] : undefined}
                        rating={item.vote_average}
                        href={`/movie/${item.id}`}
                      />
                    ))}
                  </div>
                </section>
              )}

            {/* Section: Séries */}
            {(categoryFilter === "all" || categoryFilter === "tv") &&
              results.tvShows.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-[#0a84ff]" />
                    <h2 className="text-base font-bold text-white">
                      Séries ({results.tvShows.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
                    {results.tvShows.map((item) => (
                      <PosterCard
                        key={`tv-${item.id}`}
                        id={item.id}
                        title={item.name || item.original_name || "Sans titre"}
                        posterPath={item.poster_path || null}
                        year={item.first_air_date ? item.first_air_date.split("-")[0] : undefined}
                        rating={item.vote_average}
                        href={`/tv/${item.id}`}
                      />
                    ))}
                  </div>
                </section>
              )}

            {/* Section: Personnes (Acteurs & Réalisateurs) */}
            {(categoryFilter === "all" || categoryFilter === "person") &&
              results.people.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#30d158]" />
                    <h2 className="text-base font-bold text-white">
                      Personnalités ({results.people.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {results.people.map((person) => {
                      const profileUrl = person.profile_path
                        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                        : null;
                      return (
                        <Link
                          key={`person-${person.id}`}
                          href={`/person/${person.id}`}
                          className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10 border border-white/10">
                            {profileUrl ? (
                              <Image
                                src={profileUrl}
                                alt={person.name || ""}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                                ?
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-bold text-white">
                              {person.name}
                            </h4>
                            <span className="truncate text-[10px] text-[#8e8e93]">
                              {person.known_for_department === "Directing"
                                ? "Réalisateur"
                                : person.known_for_department === "Acting"
                                ? "Acteur"
                                : person.known_for_department || "Artiste"}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

            {/* No Results Fallback */}
            {!hasResults && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] mb-4 text-[#8e8e93]">
                  <SearchIcon className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Aucun résultat trouvé
                </h3>
                <p className="mt-1 max-w-xs text-xs text-[#8e8e93]">
                  Nous n'avons trouvé aucune œuvre ou personnalité avec ces critères pour « {debouncedQuery} ». Essayez de désactiver le filtre « Avec affiche » ou de chercher un autre mot-clé.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rating Sheet */}
      {activeMediaToRate && (
        <RatingSheet
          open={isRatingOpen}
          onOpenChange={setIsRatingOpen}
          title={activeMediaToRate.title}
          posterPath={activeMediaToRate.posterPath}
          year={activeMediaToRate.year}
          onSave={() => {}}
        />
      )}

      {/* Bottom Floating Navigation */}
      <BottomNavBar />
    </div>
  );
}
