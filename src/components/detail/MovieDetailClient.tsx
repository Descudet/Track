"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Check,
  Star,
  Bookmark,
  Heart,
  Play,
  Share2,
  Tv,
  Film,
  Sparkles,
  Trash2,
} from "lucide-react";
import { RatingSheet } from "@/components/ui/RatingSheet";
import { TrailerModal } from "@/components/ui/TrailerModal";
import { ShareCardModal } from "@/components/ui/ShareCardModal";
import { PosterCard } from "@/components/ui/PosterCard";
import { ParallaxBackdrop } from "@/components/ui/ParallaxBackdrop";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";
import { getBestLogo } from "@/lib/tmdb/utils";
import {
  saveUserMediaAction,
  removeUserRatingAction,
  toggleWatchStatusAction,
  toggleFavoriteAction,
  getMediaUserStatusAction,
  removeMediaFromLibraryAction,
} from "@/lib/db/actions";
import type { TMDBMovieRaw } from "@/types/tmdb";
import type { WatchStatus } from "@/types/cinema";

interface MovieDetailClientProps {
  movie: TMDBMovieRaw;
  similarMovies?: TMDBMovieRaw[];
}

export function MovieDetailClient({
  movie,
  similarMovies = [],
}: MovieDetailClientProps) {
  const router = useRouter();

  // User interaction states
  const [status, setStatus] = useState<WatchStatus | undefined>(undefined);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [userReview, setUserReview] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [rewatchCount, setRewatchCount] = useState<number>(0);

  // Modals state
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Load existing status from database on mount
  useEffect(() => {
    getMediaUserStatusAction(movie.id, "movie").then((saved) => {
      if (saved.status) setStatus(saved.status);
      if (saved.userRating !== undefined) setUserRating(saved.userRating);
      if (saved.userReview) setUserReview(saved.userReview);
      if (saved.isFavorite) setIsFavorite(saved.isFavorite);
      if (saved.rewatchCount) setRewatchCount(saved.rewatchCount);
    });
  }, [movie.id]);

  const year = movie.release_date ? movie.release_date.split("-")[0] : "";
  const formattedRuntime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  // Extract director from crew
  const directors = movie.credits?.crew?.filter((c) => c.job === "Director") || [];

  // Extract French streaming providers (JustWatch via TMDB)
  const watchProviders = movie["watch/providers"]?.results?.FR;
  const flatrateProviders = watchProviders?.flatrate || [];
  const rentOrBuyProviders = [
    ...(watchProviders?.rent || []),
    ...(watchProviders?.buy || []),
  ].filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.provider_id === item.provider_id)
  );

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const bestLogoPath = getBestLogo(movie.images?.logos);
  const logoUrl = bestLogoPath
    ? `https://image.tmdb.org/t/p/w500${bestLogoPath}`
    : null;

  const mediaPayload = {
    tmdbId: movie.id,
    mediaType: "movie" as const,
    title: movie.title,
    originalTitle: movie.original_title,
    releaseDate: movie.release_date,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    voteAverage: movie.vote_average,
    runtimeMinutes: movie.runtime,
    genres: movie.genres?.map((g) => g.name),
    directors: directors.map((d) => d.name),
    actors: movie.credits?.cast?.slice(0, 6).map((a) => a.name) || [],
  };

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

        <button
          type="button"
          onClick={() => {
            triggerHaptic("selection");
            setIsShareOpen(true);
          }}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white active:scale-90 transition-transform shadow-lg"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Backdrop Hero Immersive Banner with Parallax */}
      <ParallaxBackdrop
        src={backdropUrl}
        alt={movie.title}
        heightClass="h-[270px] sm:h-[380px]"
      />

      {/* Movie Main Metadata Info */}
      <div className="relative -mt-36 sm:-mt-44 px-5 z-10">
        <div className="flex gap-4 items-end">
          {/* 2:3 Floating Poster */}
          <div className="relative aspect-[2/3] w-28 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-black/50 border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="150px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                Sans affiche
              </div>
            )}
          </div>

          {/* Quick Header Texts */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8e8e93]">
              {year && <span>{year}</span>}
              {formattedRuntime && (
                <>
                  <span className="text-white/20">•</span>
                  <span>{formattedRuntime}</span>
                </>
              )}
            </div>

            {/* Title or Official Logo */}
            {logoUrl && !logoError ? (
              <div className="relative mt-2 mb-1.5 h-12 sm:h-16 w-full max-w-[220px] sm:max-w-[280px]">
                <Image
                  src={logoUrl}
                  alt={movie.title}
                  fill
                  priority
                  className="object-contain object-left filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] brightness-110"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <h1 className="mt-1 text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {movie.title}
              </h1>
            )}

            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-xs text-[#8e8e93] italic mt-0.5">
                {movie.original_title}
              </p>
            )}

            {/* TMDB Rating vs Personal Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 border border-white/10 backdrop-blur-md">
                <Star className="h-3.5 w-3.5 fill-[#f5c518] text-[#f5c518]" />
                <span className="text-xs font-bold text-white">
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#8e8e93]">TMDB</span>
              </div>

              {userRating !== undefined && (
                <div className="inline-flex items-center gap-1 rounded-full bg-[#f5c518]/20 px-2.5 py-0.5 border border-[#f5c518]/40 backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-[#f5c518] text-[#f5c518]" />
                  <span className="text-xs font-bold text-[#f5c518]">
                    {userRating.toFixed(1)} ★
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-6 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {/* "Vu" button */}
          <button
            type="button"
            onClick={() => {
              const nextStatus = status === "completed" ? undefined : "completed";
              triggerHaptic(nextStatus === "completed" ? "success" : "light");
              setStatus(nextStatus);
              toggleWatchStatusAction(mediaPayload, "completed").then(() =>
                router.refresh()
              );
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-md shrink-0 touch-manipulation cursor-pointer",
              status === "completed"
                ? "bg-[#30d158] text-black border border-[#30d158]"
                : "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.14]"
            )}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{status === "completed" ? "Vu" : "Marquer vu"}</span>
          </button>

          {/* "Noter" button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setIsRatingOpen(true);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-md shrink-0 touch-manipulation cursor-pointer",
              userRating !== undefined
                ? "bg-[#f5c518] text-black border border-[#f5c518]"
                : "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.14]"
            )}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5 stroke-[2.5]",
                userRating !== undefined && "fill-current"
              )}
            />
            <span>
              {userRating !== undefined
                ? `${userRating.toFixed(1)} ★`
                : "Noter"}
            </span>
          </button>

          {/* "Watchlist" button */}
          <button
            type="button"
            onClick={() => {
              const nextStatus = status === "watchlist" ? undefined : "watchlist";
              triggerHaptic(nextStatus === "watchlist" ? "medium" : "light");
              setStatus(nextStatus);
              toggleWatchStatusAction(mediaPayload, "watchlist").then(() =>
                router.refresh()
              );
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-md shrink-0 touch-manipulation cursor-pointer",
              status === "watchlist"
                ? "bg-[#0a84ff] text-white border border-[#0a84ff]"
                : "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.14]"
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{status === "watchlist" ? "Dans ma liste" : "+ Watchlist"}</span>
          </button>

          {/* Favorite button */}
          <button
            type="button"
            onClick={() => {
              const nextFav = !isFavorite;
              triggerHaptic(nextFav ? "success" : "light");
              setIsFavorite(nextFav);
              toggleFavoriteAction(mediaPayload).then(() => router.refresh());
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-95 shrink-0 border",
              isFavorite
                ? "bg-[#ff3b30]/20 border-[#ff3b30]/50 text-[#ff3b30]"
                : "bg-white/[0.08] border-white/[0.12] text-white/70 hover:bg-white/[0.14]"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>

          {/* Trailer button */}
          {movie.videos?.results?.length ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsTrailerOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-2.5 text-xs font-semibold text-white/90 border border-white/[0.12] backdrop-blur-md hover:bg-white/[0.14] active:scale-95 shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Trailer</span>
            </button>
          ) : null}

          {/* Remove from library button if tracked */}
          {(status || userRating !== undefined || isFavorite) && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("warning");
                setStatus(undefined);
                setUserRating(undefined);
                setIsFavorite(false);
                removeMediaFromLibraryAction(movie.id, "movie").then(() =>
                  router.refresh()
                );
              }}
              title="Retirer de ma bibliothèque"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md bg-[#ff3b30]/15 text-[#ff3b30] border border-[#ff3b30]/30 hover:bg-[#ff3b30]/25 transition-all active:scale-95 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Retirer</span>
            </button>
          )}
        </div>

        {/* Feature Suggestion #1: JustWatch Streaming Providers in France */}
        {(flatrateProviders.length > 0 || rentOrBuyProviders.length > 0) && (
          <section className="mt-6 rounded-3xl bg-[#101016] p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <Tv className="h-4 w-4 text-[#0a84ff]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Où regarder en streaming (France)
              </h3>
            </div>

            {/* Flatrate (Subscription) */}
            {flatrateProviders.length > 0 && (
              <div className="mb-3">
                <span className="text-[11px] font-semibold text-[#8e8e93] block mb-2">
                  Abonnement
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {flatrateProviders.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="flex items-center gap-2 rounded-xl bg-white/[0.05] pr-3 border border-white/[0.08]"
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-black">
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-white">
                        {provider.provider_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rent / Buy */}
            {rentOrBuyProviders.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-[#8e8e93] block mb-2">
                  Location & Achat
                </span>
                <div className="flex flex-wrap gap-2">
                  {rentOrBuyProviders.slice(0, 4).map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="relative h-7 w-7 overflow-hidden rounded-lg bg-black border border-white/10"
                      title={provider.provider_name}
                    >
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                        alt={provider.provider_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Synopsis Section */}
        {movie.overview && (
          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-2">
              Synopsis
            </h3>
            <p className="text-sm leading-relaxed text-white/90">
              {movie.overview}
            </p>
          </section>
        )}

        {/* Genres Badges */}
        {movie.genres?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${g.id}?name=${encodeURIComponent(g.name)}&type=movie`}
                className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-medium text-[#8e8e93] hover:text-white hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Directors */}
        {directors.length > 0 && (
          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-2">
              Réalisation
            </h3>
            <div className="flex flex-wrap gap-2">
              {directors.map((director) => (
                <Link
                  key={director.id}
                  href={`/person/${director.id}`}
                  className="rounded-2xl bg-white/[0.05] px-3.5 py-2 text-xs font-bold text-white border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
                >
                  {director.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Casting Carousel */}
        {movie.credits?.cast?.length ? (
          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-3">
              Casting principal
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {movie.credits.cast.slice(0, 10).map((actor) => {
                const profileUrl = actor.profile_path
                  ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                  : null;
                return (
                  <Link
                    key={actor.id}
                    href={`/person/${actor.id}`}
                    className="flex w-24 shrink-0 flex-col items-center text-center group"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white/10 border border-white/10 shadow-md group-hover:scale-105 transition-transform">
                      {profileUrl ? (
                        <Image
                          src={profileUrl}
                          alt={actor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                          ?
                        </div>
                      )}
                    </div>
                    <span className="mt-2 text-xs font-semibold text-white line-clamp-1">
                      {actor.name}
                    </span>
                    <span className="text-[10px] text-[#8e8e93] line-clamp-1">
                      {actor.character}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Associated Saga / Collection */}
        {movie.belongs_to_collection && (
          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-3">
              Saga & Franchise
            </h3>
            <Link
              href={`/collection/${movie.belongs_to_collection.id}`}
              className="group flex items-center justify-between rounded-3xl bg-[#121217] p-4 border border-white/[0.08] hover:bg-[#181820] transition-colors"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f5c518]">
                  Collection
                </span>
                <h4 className="text-sm font-bold text-white group-hover:text-[#f5c518] transition-colors">
                  {movie.belongs_to_collection.name}
                </h4>
              </div>
              <span className="text-xs font-semibold text-[#8e8e93]">
                Explorer →
              </span>
            </Link>
          </section>
        )}

        {/* Studios & Production */}
        {movie.production_companies?.length ? (
          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-3">
              Studios & Production
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {movie.production_companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/studio/${company.id}`}
                  className="flex items-center gap-2.5 rounded-2xl bg-white/[0.04] px-3.5 py-2 border border-white/[0.08] hover:bg-white/[0.08] transition-colors group"
                >
                  {company.logo_path ? (
                    <div className="relative h-5 w-5 overflow-hidden rounded bg-white/10 p-0.5 shrink-0">
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                        alt={company.name}
                        fill
                        className="object-contain filter brightness-110"
                      />
                    </div>
                  ) : null}
                  <span className="text-xs font-semibold text-white/90 group-hover:text-[#f5c518] transition-colors">
                    {company.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Similar / Recommended Movies */}
        {similarMovies.length > 0 && (
          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-3">
              Titres similaires
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {similarMovies.slice(0, 8).map((sim) => (
                <div key={sim.id} className="w-32 shrink-0">
                  <PosterCard
                    id={sim.id}
                    title={sim.title}
                    posterPath={sim.poster_path}
                    year={sim.release_date ? sim.release_date.split("-")[0] : undefined}
                    rating={sim.vote_average}
                    href={`/movie/${sim.id}`}
                    onClick={() => triggerHaptic("selection")}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Rating Sheet Drawer */}
      <RatingSheet
        open={isRatingOpen}
        onOpenChange={setIsRatingOpen}
        title={movie.title}
        posterPath={movie.poster_path}
        year={year}
        initialRating={userRating ?? 4.0}
        initialReview={userReview}
        initialIsFavorite={isFavorite}
        initialRewatchCount={rewatchCount}
        onDeleteRating={() => {
          setUserRating(undefined);
          removeUserRatingAction(mediaPayload).then(() => router.refresh());
        }}
        onSave={(data) => {
          const finalRating = data.rating && data.rating > 0 ? data.rating : undefined;
          setStatus("completed");
          setUserRating(finalRating);
          setUserReview(data.review);
          setIsFavorite(data.isFavorite);
          setRewatchCount(data.rewatchCount);
          saveUserMediaAction(mediaPayload, {
            rating: finalRating,
            review: data.review,
            isFavorite: data.isFavorite,
            rewatchCount: data.rewatchCount,
            status: "completed",
          }).then(() => router.refresh());
        }}
      />

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        title={movie.title}
        videos={movie.videos?.results}
      />

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={movie.title}
        posterPath={movie.poster_path}
        year={year}
        rating={userRating ?? 4.5}
        review={userReview || "Une œuvre majeure recommandée sur Track."}
      />
    </div>
  );
}
