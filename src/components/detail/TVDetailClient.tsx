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
  CheckCircle2,
  Circle,
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
  toggleEpisodeAction,
  getTVShowEpisodeProgressAction,
  removeMediaFromLibraryAction,
} from "@/lib/db/actions";
import type { TMDBTVShowRaw } from "@/types/tmdb";
import type { WatchStatus } from "@/types/cinema";

interface TVEpisodeItem {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

interface TVDetailClientProps {
  show: TMDBTVShowRaw;
  initialSeasonEpisodes?: TVEpisodeItem[];
}

export function TVDetailClient({
  show,
  initialSeasonEpisodes = [],
}: TVDetailClientProps) {
  const router = useRouter();

  // User state
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

  // Load existing status and episode progress from DB on mount
  useEffect(() => {
    getMediaUserStatusAction(show.id, "tv").then((saved) => {
      if (saved.status) setStatus(saved.status);
      if (saved.userRating !== undefined) setUserRating(saved.userRating);
      if (saved.userReview) setUserReview(saved.userReview);
      if (saved.isFavorite) setIsFavorite(saved.isFavorite);
      if (saved.rewatchCount) setRewatchCount(saved.rewatchCount);
    });

    getTVShowEpisodeProgressAction(show.id).then((watchedList) => {
      setWatchedEpisodes(new Set(watchedList));
    });
  }, [show.id]);

  // Seasons and Episodes tracking
  const seasons = (show.seasons || []).filter((s) => s.season_number > 0);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasons[0]?.season_number || 1
  );
  const [episodes, setEpisodes] = useState<TVEpisodeItem[]>(initialSeasonEpisodes);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Watched episodes set: key is "sX-eY"
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());

  const year = show.first_air_date ? show.first_air_date.split("-")[0] : "";

  // French streaming providers
  const watchProviders = show["watch/providers"]?.results?.FR;
  const flatrateProviders = watchProviders?.flatrate || [];

  // Fetch episodes when user selects another season
  useEffect(() => {
    if (selectedSeasonNumber === 1 && initialSeasonEpisodes.length > 0) {
      setEpisodes(initialSeasonEpisodes);
      return;
    }

    let isMounted = true;
    setIsLoadingEpisodes(true);

    fetch(`/api/tmdb/tv/${show.id}/season/${selectedSeasonNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setEpisodes(data.episodes || []);
          setIsLoadingEpisodes(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load season episodes:", err);
        if (isMounted) setIsLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSeasonNumber, show.id, initialSeasonEpisodes]);

  const mediaPayload = {
    tmdbId: show.id,
    mediaType: "tv" as const,
    title: show.name,
    originalTitle: show.original_name,
    releaseDate: show.first_air_date,
    posterPath: show.poster_path,
    backdropPath: show.backdrop_path,
    voteAverage: show.vote_average,
    runtimeMinutes: show.episode_run_time?.[0] || 50,
    genres: show.genres?.map((g) => g.name),
    directors: show.created_by?.map((c: any) => c.name) || [],
    actors: show.credits?.cast?.slice(0, 6).map((a) => a.name) || [],
  };

  const toggleEpisodeWatched = (seasonNum: number, episodeNum: number) => {
    const key = `s${seasonNum}-e${episodeNum}`;
    const willBeWatched = !watchedEpisodes.has(key);
    triggerHaptic(willBeWatched ? "selection" : "light");
    setWatchedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    toggleEpisodeAction(show.id, seasonNum, episodeNum, mediaPayload).then((res) => {
      if (res.totalWatched > 0 && status !== "completed") {
        setStatus("watching");
      } else if (res.totalWatched === 0 && status === "watching") {
        setStatus(undefined);
      }
      router.refresh();
    });
  };

  const markEntireSeasonWatched = () => {
    triggerHaptic("success");
    setWatchedEpisodes((prev) => {
      const next = new Set(prev);
      for (const ep of episodes) {
        next.add(`s${selectedSeasonNumber}-e${ep.episode_number}`);
        toggleEpisodeAction(show.id, selectedSeasonNumber, ep.episode_number, mediaPayload);
      }
      return next;
    });
    if (status !== "completed") setStatus("watching");
    router.refresh();
  };

  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}`
    : null;

  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : null;

  const bestLogoPath = getBestLogo(show.images?.logos);
  const logoUrl = bestLogoPath
    ? `https://image.tmdb.org/t/p/w500${bestLogoPath}`
    : null;

  // Calculate season progress
  const seasonWatchedCount = episodes.filter((ep) =>
    watchedEpisodes.has(`s${selectedSeasonNumber}-e${ep.episode_number}`)
  ).length;
  const seasonProgressPct =
    episodes.length > 0
      ? Math.round((seasonWatchedCount / episodes.length) * 100)
      : 0;

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
        alt={show.name}
        heightClass="h-[270px] sm:h-[380px]"
      />

      {/* Main Metadata Info */}
      <div className="relative -mt-36 sm:-mt-44 px-5 z-10">
        <div className="flex gap-4 items-end">
          {/* Floating Poster */}
          <div className="relative aspect-[2/3] w-28 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-black/50 border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={show.name}
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
              <span className="text-white/20">•</span>
              <span>
                {show.number_of_seasons || seasons.length} saison
                {(show.number_of_seasons || seasons.length) > 1 ? "s" : ""}
              </span>
            </div>

            {/* Title or Official Logo */}
            {logoUrl && !logoError ? (
              <div className="relative mt-2 mb-1.5 h-12 sm:h-16 w-full max-w-[220px] sm:max-w-[280px]">
                <Image
                  src={logoUrl}
                  alt={show.name}
                  fill
                  priority
                  className="object-contain object-left filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] brightness-110"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <h1 className="mt-1 text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {show.name}
              </h1>
            )}

            {show.original_name && show.original_name !== show.name && (
              <p className="text-xs text-[#8e8e93] italic mt-0.5">
                {show.original_name}
              </p>
            )}

            {/* Ratings */}
            <div className="mt-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 border border-white/10 backdrop-blur-md">
                <Star className="h-3.5 w-3.5 fill-[#f5c518] text-[#f5c518]" />
                <span className="text-xs font-bold text-white">
                  {show.vote_average.toFixed(1)}
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
            <span>{status === "completed" ? "Série vue" : "Marquer vue"}</span>
          </button>

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

          <button
            type="button"
            onClick={() => {
              const nextFav = !isFavorite;
              triggerHaptic(nextFav ? "success" : "light");
              setIsFavorite(nextFav);
              toggleFavoriteAction(mediaPayload).then(() => router.refresh());
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-95 shrink-0 border touch-manipulation cursor-pointer",
              isFavorite
                ? "bg-[#ff3b30]/20 border-[#ff3b30]/50 text-[#ff3b30]"
                : "bg-white/[0.08] border-white/[0.12] text-white/70 hover:bg-white/[0.14]"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>

          {/* "En cours" button when watching */}
          {status === "watching" && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setStatus(undefined);
                toggleWatchStatusAction(mediaPayload, "watching").then(() =>
                  router.refresh()
                );
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold backdrop-blur-md bg-[#5856d6] text-white border border-[#5856d6] transition-all active:scale-95 shadow-md shrink-0"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>En cours</span>
            </button>
          )}

          {show.videos?.results?.length ? (
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
          {(status || userRating !== undefined || isFavorite || watchedEpisodes.size > 0) && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("warning");
                setStatus(undefined);
                setUserRating(undefined);
                setIsFavorite(false);
                setWatchedEpisodes(new Set());
                removeMediaFromLibraryAction(show.id, "tv").then(() =>
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

        {/* Streaming Providers */}
        {flatrateProviders.length > 0 && (
          <section className="mt-6 rounded-3xl bg-[#101016] p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <Tv className="h-4 w-4 text-[#0a84ff]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Disponible en streaming (France)
              </h3>
            </div>
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
          </section>
        )}

        {/* Synopsis */}
        {show.overview && (
          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-2">
              Synopsis
            </h3>
            <p className="text-sm leading-relaxed text-white/90">
              {show.overview}
            </p>
          </section>
        )}

        {/* Genres Badges */}
        {show.genres?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {show.genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${g.id}?name=${encodeURIComponent(g.name)}&type=tv`}
                className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-medium text-[#8e8e93] hover:text-white hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* SEASONS & EPISODES INTERACTIVE TRACKER */}
        <section className="mt-8 rounded-3xl bg-[#0f0f14] p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Saisons & Épisodes
            </h3>
            <span className="text-xs font-semibold text-[#E50914]">
              {seasonWatchedCount} / {episodes.length} vus ({seasonProgressPct}%)
            </span>
          </div>

          {/* Season Progress Bar */}
          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#30d158] transition-all duration-300"
              style={{ width: `${seasonProgressPct}%` }}
            />
          </div>

          {/* Season Selectors (Pills) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {seasons.map((s) => {
              const isSelected = s.season_number === selectedSeasonNumber;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSeasonNumber(s.season_number)}
                  className={cn(
                    "rounded-2xl px-4 py-2 text-xs font-bold transition-all shrink-0 select-none active:scale-95",
                    isSelected
                      ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/25"
                      : "bg-white/[0.06] text-[#8e8e93] hover:text-white border border-white/[0.06]"
                  )}
                >
                  Saison {s.season_number}
                </button>
              );
            })}
          </div>

          {/* Action to Mark entire season */}
          <div className="my-3 flex justify-end">
            <button
              type="button"
              onClick={markEntireSeasonWatched}
              className="text-xs font-semibold text-[#30d158] hover:underline"
            >
              ✓ Marquer toute la saison comme vue
            </button>
          </div>

          {/* Episodes List */}
          {isLoadingEpisodes ? (
            <div className="py-8 text-center text-xs text-[#8e8e93]">
              Chargement des épisodes...
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {episodes.map((ep) => {
                const isEpWatched = watchedEpisodes.has(
                  `s${selectedSeasonNumber}-e${ep.episode_number}`
                );
                const stillUrl = ep.still_path
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : null;

                return (
                  <div
                    key={ep.id}
                    className={cn(
                      "flex items-center gap-3.5 rounded-2xl p-3 border transition-colors",
                      isEpWatched
                        ? "bg-[#30d158]/5 border-[#30d158]/30"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    )}
                  >
                    {/* Episode 16:9 Thumbnail */}
                    <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl bg-black/40 border border-white/10">
                      {stillUrl ? (
                        <Image
                          src={stillUrl}
                          alt={ep.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                          EP {ep.episode_number}
                        </div>
                      )}
                    </div>

                    {/* Episode Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8e8e93]">
                        <span>Épisode {ep.episode_number}</span>
                        {ep.runtime && (
                          <>
                            <span className="text-white/20">•</span>
                            <span>{ep.runtime}m</span>
                          </>
                        )}
                      </div>
                      <h4 className="truncate text-xs font-bold text-white mt-0.5">
                        {ep.name}
                      </h4>
                      {ep.overview && (
                        <p className="line-clamp-2 text-[11px] text-[#8e8e93] mt-1 leading-snug">
                          {ep.overview}
                        </p>
                      )}
                    </div>

                    {/* Watched Episode Toggle Button */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleEpisodeWatched(
                          selectedSeasonNumber,
                          ep.episode_number
                        )
                      }
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90",
                        isEpWatched
                          ? "bg-[#30d158] border-[#30d158] text-black shadow-sm"
                          : "bg-white/[0.06] border-white/15 text-white/40 hover:text-white"
                      )}
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Casting */}
        {show.credits?.cast?.length ? (
          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-3">
              Casting principal
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {show.credits.cast.slice(0, 10).map((actor) => {
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

        {/* Studios & Production */}
        {show.production_companies?.length ? (
          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-3">
              Studios & Production
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {show.production_companies.map((company) => (
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
      </div>

      {/* Rating Sheet Drawer */}
      <RatingSheet
        open={isRatingOpen}
        onOpenChange={setIsRatingOpen}
        title={show.name}
        posterPath={show.poster_path}
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
        title={show.name}
        videos={show.videos?.results}
      />

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={show.name}
        posterPath={show.poster_path}
        year={year}
        rating={userRating ?? 4.5}
        review={userReview || "Une série incontournable suivie sur Track."}
      />
    </div>
  );
}
