"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  Film,
  Tv,
  Sparkles,
  Popcorn,
  Star,
  Play,
  ChevronRight,
  Clock,
  RotateCw,
  LogIn,
  User,
} from "lucide-react";
import { PosterCard } from "@/components/ui/PosterCard";
import { HeroSlider } from "@/components/discover/HeroSlider";
import { AuthModal } from "@/components/auth/AuthModal";
import { RatingSheet } from "@/components/ui/RatingSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BottomNavBar } from "@/components/ui/BottomNavBar";
import { triggerHaptic } from "@/lib/utils/haptics";
import {
  saveUserMediaAction,
  toggleWatchStatusAction,
  removeUserRatingAction,
  type HomeFeedData,
} from "@/lib/db/actions";
import type { TMDBSearchResultItem, TMDBMovieRaw, TMDBTVShowRaw } from "@/types/tmdb";
import type { WatchStatus } from "@/types/cinema";

interface DiscoverClientProps {
  currentUser?: {
    id: string;
    email: string | null;
    displayName: string;
  } | null;
  trendingItems: TMDBSearchResultItem[];
  popularMovies: TMDBMovieRaw[];
  popularShows: TMDBTVShowRaw[];
  nowPlayingMovies?: TMDBMovieRaw[];
  homeFeed?: HomeFeedData;
}

export function DiscoverClient({
  currentUser,
  trendingItems,
  popularMovies,
  popularShows,
  nowPlayingMovies = [],
  homeFeed = { watchingShows: [], recommendations: null },
}: DiscoverClientProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<"all" | "movies" | "shows">("all");

  // Multi-hero items with backdrops
  const heroPool = trendingItems.filter((i) => i.backdrop_path).slice(0, 5);

  // Modal d'authentification / bienvenue
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("track_user", JSON.stringify(currentUser));
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("track_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const isGuest =
      typeof window !== "undefined" &&
      localStorage.getItem("track_guest_mode") === "true";
    const storedUser =
      typeof window !== "undefined" &&
      localStorage.getItem("track_user");

    if (!currentUser && !user && !isGuest && !storedUser) {
      setIsAuthModalOpen(true);
    }
  }, [currentUser, user]);

  // Rating sheet state
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [activeMediaToRate, setActiveMediaToRate] = useState<{
    id: number;
    title: string;
    posterPath: string | null;
    backdropPath?: string | null;
    year?: string;
    mediaType?: "movie" | "tv";
  } | null>(null);

  // Local state for user interactions (optimistic UI)
  const [userStates, setUserStates] = useState<
    Record<
      number,
      {
        status?: WatchStatus;
        userRating?: number;
        isFavorite?: boolean;
        review?: string;
        rewatchCount?: number;
      }
    >
  >({});

  const handleToggleWatched = (item: TMDBSearchResultItem) => {
    const isWatched = userStates[item.id]?.status === "completed";
    const nextStatus = isWatched ? undefined : "completed";
    triggerHaptic(nextStatus === "completed" ? "success" : "light");

    setUserStates((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        status: nextStatus,
      },
    }));

    const mediaType = (item.media_type as "movie" | "tv") || "movie";
    const title = item.title || item.name || "Sans titre";
    const releaseDate = item.release_date || item.first_air_date;

    toggleWatchStatusAction(
      {
        tmdbId: item.id,
        mediaType,
        title,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate,
        voteAverage: item.vote_average,
      },
      "completed"
    );
  };

  const handleToggleWatchlist = (item: TMDBSearchResultItem) => {
    const isInWatchlist = userStates[item.id]?.status === "watchlist";
    const nextStatus = isInWatchlist ? undefined : "watchlist";
    triggerHaptic(nextStatus === "watchlist" ? "medium" : "light");

    setUserStates((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        status: nextStatus,
      },
    }));

    const mediaType = (item.media_type as "movie" | "tv") || "movie";
    const title = item.title || item.name || "Sans titre";
    const releaseDate = item.release_date || item.first_air_date;

    toggleWatchStatusAction(
      {
        tmdbId: item.id,
        mediaType,
        title,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate,
        voteAverage: item.vote_average,
      },
      "watchlist"
    );
  };

  const handleOpenRating = (item: {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    media_type?: string;
  }) => {
    triggerHaptic("selection");
    const title = item.title || item.name || item.original_title || item.original_name || "Sans titre";
    const date = item.release_date || item.first_air_date;
    const year = date ? date.split("-")[0] : undefined;
    const mediaType = (item.media_type as "movie" | "tv") || "movie";

    setActiveMediaToRate({
      id: item.id,
      title,
      posterPath: item.poster_path || null,
      backdropPath: item.backdrop_path || null,
      year,
      mediaType,
    });
    setIsRatingOpen(true);
  };

  const handleSaveRating = (data: {
    rating: number;
    review: string;
    isFavorite: boolean;
    rewatchCount: number;
  }) => {
    if (!activeMediaToRate) return;
    const finalRating = data.rating && data.rating > 0 ? data.rating : undefined;
    setUserStates((prev) => ({
      ...prev,
      [activeMediaToRate.id]: {
        ...prev[activeMediaToRate.id],
        status: "completed",
        userRating: finalRating,
        review: data.review,
        isFavorite: data.isFavorite,
        rewatchCount: data.rewatchCount,
      },
    }));

    saveUserMediaAction(
      {
        tmdbId: activeMediaToRate.id,
        mediaType: activeMediaToRate.mediaType || "movie",
        title: activeMediaToRate.title,
        posterPath: activeMediaToRate.posterPath,
        backdropPath: activeMediaToRate.backdropPath,
        releaseDate: activeMediaToRate.year,
      },
      {
        rating: finalRating,
        review: data.review,
        isFavorite: data.isFavorite,
        rewatchCount: data.rewatchCount,
        status: "completed",
      }
    );
  };

  // Filter lists based on segmented control
  const filteredTrending =
    filterType === "movies"
      ? trendingItems.filter((i) => i.media_type === "movie")
      : filterType === "shows"
      ? trendingItems.filter((i) => i.media_type === "tv")
      : trendingItems;

  return (
    <div className="relative min-h-screen bg-[#050507] text-white pb-28">
      {/* iOS Top Safe Area Header */}
      <header
        suppressHydrationWarning
        className="sticky top-0 z-30 flex items-center justify-between bg-[#050507]/80 px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-[0_0_16px_rgba(229,9,20,0.45)]">
            <Popcorn className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Track
          </span>
        </div>

        {/* User Account / Se Connecter */}
        <div suppressHydrationWarning className="flex items-center gap-2">
          {user ? (
            <Link
              href="/profile"
              onClick={() => triggerHaptic("selection")}
              className="flex items-center gap-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 px-3 py-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Mon profil"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#E50914] to-[#8a060d] text-[10px] font-black text-white">
                {user.displayName ? user.displayName.slice(0, 1).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-semibold text-white/90 max-w-[100px] truncate hidden sm:inline">
                {user.displayName}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E50914] to-[#B81D24] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_14px_rgba(229,9,20,0.4)] hover:brightness-110 active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col gap-6">
        {/* Multi-Hero Carousel with 5s Auto-Slide */}
        {heroPool.length > 0 && (
          <HeroSlider
            items={heroPool}
            userStates={userStates}
            onToggleWatch={handleToggleWatched}
            onToggleWatchlist={handleToggleWatchlist}
            onOpenRate={handleOpenRating}
          />
        )}

        {/* Section 0: Continuer à regarder (Séries en cours) */}
        {homeFeed.watchingShows && homeFeed.watchingShows.length > 0 && (
          <section className="flex flex-col gap-3 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5856d6]/20 text-[#5856d6]">
                  <Tv className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Continuer à regarder
                </h2>
              </div>
              <span className="text-xs font-medium text-[#8e8e93]">
                En cours
              </span>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
              {homeFeed.watchingShows.map((show) => {
                const backdropUrl = show.backdropPath
                  ? `https://image.tmdb.org/t/p/w780${show.backdropPath}`
                  : show.posterPath
                  ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                  : null;

                return (
                  <Link
                    key={`watching-${show.id}`}
                    href={`/tv/${show.id}`}
                    onClick={() => triggerHaptic("selection")}
                    className="relative w-64 shrink-0 rounded-2xl overflow-hidden bg-[#101015] border border-white/10 group active:scale-[0.98] transition-all shadow-md"
                  >
                    {/* Backdrop Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                      {backdropUrl ? (
                        <Image
                          src={backdropUrl}
                          alt={show.title}
                          fill
                          sizes="280px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                          {show.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Play floating badge */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white group-hover:scale-110 transition-transform shadow-lg">
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Episode Badge */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-white">
                        <span>
                          {show.lastSeason && show.lastEpisode
                            ? `S${show.lastSeason} • Épisode ${show.lastEpisode}`
                            : `${show.watchedEpisodesCount} épisode(s) vu(s)`}
                        </span>
                        <span className="text-[#30d158] text-[10px]">Reprendre</span>
                      </div>
                    </div>

                    {/* Meta info & Progress bar */}
                    <div className="p-3">
                      <h4 className="font-bold text-xs text-white truncate leading-tight">
                        {show.title}
                      </h4>
                      {/* Stylized progress track */}
                      <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5856d6] to-[#af52de] rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(15, show.watchedEpisodesCount * 12)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Section Recommandations Personnalisées */}
        {homeFeed.recommendations && homeFeed.recommendations.items.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f5c518]/20 text-[#f5c518]">
                  <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Recommandé pour vous
                  </h2>
                  <p className="text-[11px] text-[#8e8e93]">
                    {homeFeed.recommendations.seedRating
                      ? `Inspiré par votre note de ${homeFeed.recommendations.seedRating.toFixed(1)} ★ sur « ${homeFeed.recommendations.seedTitle} »`
                      : `Inspiré par votre coup de cœur « ${homeFeed.recommendations.seedTitle} »`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar py-2">
              {homeFeed.recommendations.items.map((item: any) => {
                const state = userStates[item.id] || {};
                const title = item.title || item.name || "Sans titre";
                const date = item.release_date || item.first_air_date;
                const year = date ? date.split("-")[0] : undefined;
                const linkHref =
                  item.media_type === "tv" || (!item.title && item.name)
                    ? `/tv/${item.id}`
                    : `/movie/${item.id}`;

                return (
                  <div key={`rec-${item.id}`} className="w-36 shrink-0 sm:w-44">
                    <PosterCard
                      id={item.id}
                      title={title}
                      posterPath={item.poster_path || null}
                      year={year}
                      rating={item.vote_average}
                      userRating={state.userRating}
                      status={state.status}
                      isFavorite={state.isFavorite}
                      href={linkHref}
                      onClick={() => triggerHaptic("selection")}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Filter Toggle */}
        <div className="px-5">
          <SegmentedControl
            options={[
              { value: "all", label: "Catalogue", count: trendingItems.length },
              { value: "movies", label: "Films", count: popularMovies.length },
              { value: "shows", label: "Séries", count: popularShows.length },
            ]}
            value={filterType}
            onChange={(val) => setFilterType(val as "all" | "movies" | "shows")}
          />
        </div>

        {/* Section 1: Tendances de la semaine */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#E50914]" />
              <h2 className="text-base font-bold text-white">
                Tendances de la semaine
              </h2>
            </div>
            <span className="text-xs font-medium text-[#8e8e93]">
              Faites glisser →
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar py-2">
            {filteredTrending.map((item) => {
              const state = userStates[item.id] || {};
              const title = item.title || item.name || "Sans titre";
              const date = item.release_date || item.first_air_date;
              const year = date ? date.split("-")[0] : undefined;

              const linkHref = item.media_type === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;

              return (
                <div key={`trend-${item.id}`} className="w-36 shrink-0 sm:w-44">
                  <PosterCard
                    id={item.id}
                    title={title}
                    posterPath={item.poster_path || null}
                    year={year}
                    rating={item.vote_average}
                    userRating={state.userRating}
                    status={state.status}
                    isFavorite={state.isFavorite}
                    href={linkHref}
                    onClick={() => triggerHaptic("selection")}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Actuellement au cinéma */}
        {nowPlayingMovies && nowPlayingMovies.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-[#E50914]" />
                <h2 className="text-base font-bold text-white">
                  Actuellement au cinéma
                </h2>
              </div>
              <span className="text-xs font-medium text-[#8e8e93]">
                En salle
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar py-2">
              {nowPlayingMovies.slice(0, 10).map((movie) => {
                const state = userStates[movie.id] || {};
                const year = movie.release_date ? movie.release_date.split("-")[0] : undefined;

                return (
                  <div key={`cinema-${movie.id}`} className="w-36 shrink-0 sm:w-44">
                    <PosterCard
                      id={movie.id}
                      title={movie.title}
                      posterPath={movie.poster_path}
                      year={year}
                      rating={movie.vote_average}
                      userRating={state.userRating}
                      status={state.status}
                      isFavorite={state.isFavorite}
                      href={`/movie/${movie.id}`}
                      onClick={() => triggerHaptic("selection")}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 2: Films Populaires */}
        {(filterType === "all" || filterType === "movies") && (
          <section className="flex flex-col gap-3 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-[#E50914]" />
                <h2 className="text-base font-bold text-white">
                  Films populaires
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {popularMovies.slice(0, 8).map((movie) => {
                const state = userStates[movie.id] || {};
                const year = movie.release_date ? movie.release_date.split("-")[0] : undefined;

                return (
                  <PosterCard
                    key={`pop-movie-${movie.id}`}
                    id={movie.id}
                    title={movie.title}
                    posterPath={movie.poster_path}
                    year={year}
                    rating={movie.vote_average}
                    userRating={state.userRating}
                    status={state.status}
                    isFavorite={state.isFavorite}
                    href={`/movie/${movie.id}`}
                    onClick={() => triggerHaptic("selection")}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Séries Populaires */}
        {(filterType === "all" || filterType === "shows") && (
          <section className="flex flex-col gap-3 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-[#0a84ff]" />
                <h2 className="text-base font-bold text-white">
                  Séries du moment
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {popularShows.slice(0, 8).map((show) => {
                const state = userStates[show.id] || {};
                const year = show.first_air_date ? show.first_air_date.split("-")[0] : undefined;

                return (
                  <PosterCard
                    key={`pop-show-${show.id}`}
                    id={show.id}
                    title={show.name}
                    posterPath={show.poster_path}
                    year={year}
                    rating={show.vote_average}
                    userRating={state.userRating}
                    status={state.status}
                    isFavorite={state.isFavorite}
                    href={`/tv/${show.id}`}
                    onClick={() => triggerHaptic("selection")}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Rating & Review Bottom Sheet */}
      {activeMediaToRate && (
        <RatingSheet
          open={isRatingOpen}
          onOpenChange={setIsRatingOpen}
          title={activeMediaToRate.title}
          posterPath={activeMediaToRate.posterPath}
          year={activeMediaToRate.year}
          initialRating={userStates[activeMediaToRate.id]?.userRating ?? 4.0}
          initialReview={userStates[activeMediaToRate.id]?.review ?? ""}
          initialIsFavorite={userStates[activeMediaToRate.id]?.isFavorite ?? false}
          initialRewatchCount={userStates[activeMediaToRate.id]?.rewatchCount ?? 0}
          onDeleteRating={() => {
            if (!activeMediaToRate) return;
            setUserStates((prev) => ({
              ...prev,
              [activeMediaToRate.id]: {
                ...prev[activeMediaToRate.id],
                userRating: undefined,
              },
            }));
            removeUserRatingAction({
              tmdbId: activeMediaToRate.id,
              mediaType: activeMediaToRate.mediaType || "movie",
              title: activeMediaToRate.title,
              posterPath: activeMediaToRate.posterPath,
              backdropPath: activeMediaToRate.backdropPath,
              releaseDate: activeMediaToRate.year,
            });
          }}
          onSave={handleSaveRating}
        />
      )}

      {/* Auth Gateway & Welcome Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => {
          if (newUser) {
            setUser(newUser);
          }
          setIsAuthModalOpen(false);
          router.refresh();
        }}
        allowDismiss={true}
      />

      {/* Floating Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}
