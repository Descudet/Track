"use server";

import { revalidatePath } from "next/cache";
import { db, ensureDbInitialized } from "./index";
import { mediaItems, userMedia, episodeProgress, watchLogs } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { WatchStatus } from "@/types/cinema";
import { searchMovieExact, getMediaLogo, getRecommendations, getTopRated, fetchTMDB } from "@/lib/tmdb/client";
import { getCurrentUserId } from "@/lib/auth";

export interface MediaPayload {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  runtimeMinutes?: number;
  genres?: string[];
  directors?: string[];
  actors?: string[];
}

export interface RatingReviewPayload {
  rating?: number;
  review?: string;
  isFavorite?: boolean;
  rewatchCount?: number;
  status?: WatchStatus;
  watchedAt?: string;
}

/**
 * Ensure media exists in cache table
 */
async function ensureMediaCached(media: MediaPayload) {
  const mediaItemId = `${media.mediaType}_${media.tmdbId}`;

  const existing = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, mediaItemId))
    .get();

  const now = Date.now();

  if (!existing) {
    await db.insert(mediaItems).values({
      id: mediaItemId,
      tmdbId: media.tmdbId,
      mediaType: media.mediaType,
      title: media.title,
      originalTitle: media.originalTitle || null,
      releaseDate: media.releaseDate || null,
      posterPath: media.posterPath || null,
      backdropPath: media.backdropPath || null,
      voteAverage: media.voteAverage || null,
      runtimeMinutes: media.runtimeMinutes || null,
      genres: media.genres ? JSON.stringify(media.genres) : null,
      directors: media.directors ? JSON.stringify(media.directors) : null,
      actors: media.actors ? JSON.stringify(media.actors) : null,
      cachedAt: now,
    });
  } else {
    // Update poster, backdrop, directors, actors or title if new or previously missing
    const shouldUpdatePoster = Boolean(media.posterPath && media.posterPath !== existing.posterPath);
    const shouldUpdateBackdrop = Boolean(media.backdropPath && media.backdropPath !== existing.backdropPath);
    const shouldUpdateTitle = Boolean(media.title && media.title !== existing.title);
    const shouldUpdateDirectors = Boolean(media.directors && media.directors.length > 0 && !existing.directors);
    const shouldUpdateActors = Boolean(media.actors && media.actors.length > 0 && !existing.actors);
    const shouldUpdateGenres = Boolean(media.genres && media.genres.length > 0 && !existing.genres);
    const shouldUpdateRuntime = Boolean(media.runtimeMinutes && !existing.runtimeMinutes);

    if (
      shouldUpdatePoster ||
      shouldUpdateBackdrop ||
      shouldUpdateTitle ||
      shouldUpdateDirectors ||
      shouldUpdateActors ||
      shouldUpdateGenres ||
      shouldUpdateRuntime
    ) {
      await db
        .update(mediaItems)
        .set({
          ...(shouldUpdatePoster ? { posterPath: media.posterPath } : {}),
          ...(shouldUpdateBackdrop ? { backdropPath: media.backdropPath } : {}),
          ...(shouldUpdateTitle ? { title: media.title } : {}),
          ...(shouldUpdateDirectors ? { directors: JSON.stringify(media.directors) } : {}),
          ...(shouldUpdateActors ? { actors: JSON.stringify(media.actors) } : {}),
          ...(shouldUpdateGenres ? { genres: JSON.stringify(media.genres) } : {}),
          ...(shouldUpdateRuntime ? { runtimeMinutes: media.runtimeMinutes } : {}),
          cachedAt: now,
        })
        .where(eq(mediaItems.id, mediaItemId));
    }
  }

  return mediaItemId;
}

/**
 * Save rating, review, favorite and status
 */
export async function saveUserMediaAction(
  media: MediaPayload,
  data: RatingReviewPayload
) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const mediaItemId = await ensureMediaCached(media);
  const now = Date.now();

  const existing = await db
    .select()
    .from(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    )
    .get();

  const finalStatus = data.status || (data.rating ? "completed" : "completed");

  if (existing) {
    const finalRating =
      data.rating === null || data.rating === 0
        ? null
        : data.rating !== undefined
        ? data.rating
        : existing.userRating;

    await db
      .update(userMedia)
      .set({
        status: finalStatus,
        userRating: finalRating,
        userReview: data.review !== undefined ? data.review : existing.userReview,
        isFavorite:
          data.isFavorite !== undefined
            ? data.isFavorite
              ? 1
              : 0
            : existing.isFavorite,
        rewatchCount:
          data.rewatchCount !== undefined
            ? data.rewatchCount
            : existing.rewatchCount,
        watchedAt:
          data.watchedAt !== undefined
            ? data.watchedAt
            : finalStatus === "completed"
            ? existing.watchedAt || new Date().toISOString()
            : existing.watchedAt,
        updatedAt: now,
      })
      .where(eq(userMedia.id, existing.id));
  } else {
    await db.insert(userMedia).values({
      id: `${userId}_${mediaItemId}`,
      userId,
      mediaItemId,
      status: finalStatus,
      isFavorite: data.isFavorite ? 1 : 0,
      userRating: data.rating && data.rating > 0 ? data.rating : null,
      userReview: data.review || null,
      rewatchCount: data.rewatchCount || 0,
      watchedAt:
        data.watchedAt ||
        (finalStatus === "completed" ? new Date().toISOString() : null),
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Remove/delete rating specifically
 */
export async function removeUserRatingAction(media: MediaPayload) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const mediaItemId = await ensureMediaCached(media);
  const now = Date.now();

  const existing = await db
    .select()
    .from(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    )
    .get();

  if (existing) {
    if ((!existing.status || existing.status === "") && !existing.isFavorite) {
      await db.delete(userMedia).where(eq(userMedia.id, existing.id));
    } else {
      await db
        .update(userMedia)
        .set({
          userRating: null,
          updatedAt: now,
        })
        .where(eq(userMedia.id, existing.id));
    }
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Toggle quick watch status (completed, watchlist, or undefined)
 */
export async function toggleWatchStatusAction(
  media: MediaPayload,
  targetStatus: WatchStatus
) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const mediaItemId = await ensureMediaCached(media);
  const now = Date.now();

  const existing = await db
    .select()
    .from(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    )
    .get();

  if (existing) {
    if (existing.status === targetStatus) {
      // Toggle off: if no personal rating and not favorite, clean up row completely
      if ((!existing.userRating || existing.userRating === 0) && !existing.isFavorite) {
        await db.delete(userMedia).where(eq(userMedia.id, existing.id));
      } else {
        await db
          .update(userMedia)
          .set({
            status: "",
            watchedAt: null,
            updatedAt: now,
          })
          .where(eq(userMedia.id, existing.id));
      }
    } else {
      await db
        .update(userMedia)
        .set({
          status: targetStatus,
          watchedAt: targetStatus === "completed" ? new Date().toISOString() : existing.watchedAt,
          updatedAt: now,
        })
        .where(eq(userMedia.id, existing.id));
    }
  } else {
    await db.insert(userMedia).values({
      id: `${userId}_${mediaItemId}`,
      userId,
      mediaItemId,
      status: targetStatus,
      isFavorite: 0,
      rewatchCount: 0,
      watchedAt: targetStatus === "completed" ? new Date().toISOString() : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Toggle favorite
 */
export async function toggleFavoriteAction(media: MediaPayload) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const mediaItemId = await ensureMediaCached(media);
  const now = Date.now();

  const existing = await db
    .select()
    .from(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    )
    .get();

  if (existing) {
    const newIsFavorite = existing.isFavorite ? 0 : 1;
    if (
      newIsFavorite === 0 &&
      (!existing.status || existing.status === "") &&
      (!existing.userRating || existing.userRating === 0)
    ) {
      await db.delete(userMedia).where(eq(userMedia.id, existing.id));
    } else {
      await db
        .update(userMedia)
        .set({
          isFavorite: newIsFavorite,
          updatedAt: now,
        })
        .where(eq(userMedia.id, existing.id));
    }
  } else {
    await db.insert(userMedia).values({
      id: `${userId}_${mediaItemId}`,
      userId,
      mediaItemId,
      status: "watchlist",
      isFavorite: 1,
      rewatchCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Get user status for a specific media item
 */
export async function getMediaUserStatusAction(tmdbId: number, mediaType: "movie" | "tv") {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const mediaItemId = `${mediaType}_${tmdbId}`;

  const row = await db
    .select()
    .from(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    )
    .get();

  if (!row) {
    return {
      status: undefined,
      userRating: undefined,
      userReview: "",
      isFavorite: false,
      rewatchCount: 0,
    };
  }

  return {
    status: row.status as WatchStatus,
    userRating: row.userRating ?? undefined,
    userReview: row.userReview ?? "",
    isFavorite: Boolean(row.isFavorite),
    rewatchCount: row.rewatchCount,
  };
}

/**
 * Toggle episode watched status
 */
export async function toggleEpisodeAction(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
  mediaPayload?: MediaPayload
) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const id = `${userId}_tv${tvId}_s${seasonNumber}_e${episodeNumber}`;

  const existing = await db
    .select()
    .from(episodeProgress)
    .where(eq(episodeProgress.id, id))
    .get();

  let isNowWatched = false;
  if (existing) {
    const newIsWatched = existing.isWatched ? 0 : 1;
    await db
      .update(episodeProgress)
      .set({ isWatched: newIsWatched, watchedAt: new Date().toISOString() })
      .where(eq(episodeProgress.id, id));
    isNowWatched = Boolean(newIsWatched);
  } else {
    await db.insert(episodeProgress).values({
      id,
      userId,
      tmdbTvId: tvId,
      seasonNumber,
      episodeNumber,
      isWatched: 1,
      watchedAt: new Date().toISOString(),
    });
    isNowWatched = true;
  }

  // Count active watched episodes for this show
  const watchedRows = await db
    .select()
    .from(episodeProgress)
    .where(
      and(
        eq(episodeProgress.userId, userId),
        eq(episodeProgress.tmdbTvId, tvId),
        eq(episodeProgress.isWatched, 1)
      )
    )
    .all();

  const totalWatched = watchedRows.length;
  const mediaItemId = `tv_${tvId}`;
  const now = Date.now();

  const existingShow = await db
    .select()
    .from(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    )
    .get();

  if (totalWatched > 0) {
    if (existingShow) {
      if (existingShow.status !== "completed") {
        await db
          .update(userMedia)
          .set({ status: "watching", updatedAt: now })
          .where(eq(userMedia.id, existingShow.id));
      }
    } else if (mediaPayload) {
      await ensureMediaCached(mediaPayload);
      await db.insert(userMedia).values({
        id: `${userId}_${mediaItemId}`,
        userId,
        mediaItemId,
        status: "watching",
        isFavorite: 0,
        rewatchCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  } else {
    // 0 episodes watched: if show was "watching", clear status or remove row
    if (existingShow && existingShow.status === "watching") {
      if (!existingShow.userRating && !existingShow.isFavorite) {
        await db.delete(userMedia).where(eq(userMedia.id, existingShow.id));
      } else {
        await db
          .update(userMedia)
          .set({ status: "", updatedAt: now })
          .where(eq(userMedia.id, existingShow.id));
      }
    }
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { isWatched: isNowWatched, totalWatched };
}

/**
 * Get watched episodes set for a TV show
 */
export async function getTVShowEpisodeProgressAction(tvId: number) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();

  const rows = await db
    .select()
    .from(episodeProgress)
    .where(
      and(
        eq(episodeProgress.userId, userId),
        eq(episodeProgress.tmdbTvId, tvId),
        eq(episodeProgress.isWatched, 1)
      )
    )
    .all();

  return rows.map((r) => `s${r.seasonNumber}-e${r.episodeNumber}`);
}

/**
 * Remove any media item completely from the user library
 */
export async function removeMediaFromLibraryAction(
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  const mediaItemId = `${mediaType}_${tmdbId}`;

  await db
    .delete(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId)
      )
    );

  if (mediaType === "tv") {
    await db
      .delete(episodeProgress)
      .where(
        and(
          eq(episodeProgress.userId, userId),
          eq(episodeProgress.tmdbTvId, tmdbId)
        )
      );
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Get library items with joined metadata
 */
export async function getUserLibraryAction() {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();

  const rows = await db
    .select({
      id: mediaItems.tmdbId,
      mediaItemId: mediaItems.id,
      title: mediaItems.title,
      posterPath: mediaItems.posterPath,
      releaseDate: mediaItems.releaseDate,
      mediaType: mediaItems.mediaType,
      status: userMedia.status,
      userRating: userMedia.userRating,
      userReview: userMedia.userReview,
      isFavorite: userMedia.isFavorite,
      rewatchCount: userMedia.rewatchCount,
      updatedAt: userMedia.updatedAt,
    })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(
      and(
        eq(userMedia.userId, userId),
        sql`(${userMedia.status} IS NOT NULL AND ${userMedia.status} != '' OR (${userMedia.userRating} IS NOT NULL AND ${userMedia.userRating} > 0) OR ${userMedia.isFavorite} = 1)`
      )
    )
    .orderBy(desc(userMedia.updatedAt))
    .all();

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    posterPath: r.posterPath,
    year: r.releaseDate ? r.releaseDate.split("-")[0] : "",
    mediaType: r.mediaType as "movie" | "tv",
    status: r.status as WatchStatus,
    userRating: r.userRating ?? undefined,
    userReview: r.userReview ?? "",
    isFavorite: Boolean(r.isFavorite),
    rewatchCount: r.rewatchCount,
  }));
}

/**
 * Get aggregated user statistics calculated from database
 */
export async function getUserStatsAction() {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();

  const items = await db
    .select({
      mediaItemId: userMedia.mediaItemId,
      mediaType: mediaItems.mediaType,
      runtimeMinutes: mediaItems.runtimeMinutes,
      genres: mediaItems.genres,
      directors: mediaItems.directors,
      actors: mediaItems.actors,
      status: userMedia.status,
      userRating: userMedia.userRating,
      userReview: userMedia.userReview,
      isFavorite: userMedia.isFavorite,
      watchedAt: userMedia.watchedAt,
      title: mediaItems.title,
      posterPath: mediaItems.posterPath,
      releaseDate: mediaItems.releaseDate,
      tmdbId: mediaItems.tmdbId,
    })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(eq(userMedia.userId, userId))
    .all();

  let moviesWatched = 0;
  let showsWatched = 0;
  let totalMinutes = 0;
  let ratingsSum = 0;
  let ratingsCount = 0;
  let favoritesCount = 0;
  let watchlistCount = 0;

  const genreCounts: Record<string, number> = {};
  const directorCounts: Record<string, { count: number; works: string[] }> = {};
  const actorCounts: Record<string, { count: number; works: string[] }> = {};
  const recentReviews: any[] = [];

  for (const item of items) {
    // Watchlist items MUST NOT count towards watched stats (genres, directors, actors, runtime)
    if (item.status === "watchlist") {
      watchlistCount++;
      continue;
    }

    const isCompleted = item.status === "completed";
    const isWatchingTV = item.status === "watching" && item.mediaType === "tv";

    if (isCompleted || isWatchingTV) {
      if (item.mediaType === "movie" && isCompleted) moviesWatched++;
      if (item.mediaType === "tv") showsWatched++;
      if (item.runtimeMinutes) totalMinutes += item.runtimeMinutes;

      let parsedDirs: string[] = [];
      let parsedActors: string[] = [];
      let parsedGenres: string[] = [];

      if (item.directors) {
        try {
          parsedDirs = JSON.parse(item.directors);
        } catch {}
      }
      if (item.actors) {
        try {
          parsedActors = JSON.parse(item.actors);
        } catch {}
      }
      if (item.genres) {
        try {
          parsedGenres = JSON.parse(item.genres);
        } catch {}
      }

      // If actors, directors or runtime are missing on a watched item, enrich from TMDB
      if ((parsedDirs.length === 0 || parsedActors.length === 0) && item.tmdbId) {
        try {
          const endpoint = item.mediaType === "tv" ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`;
          const tmdbData = await fetchTMDB<any>(endpoint, { params: { append_to_response: "credits" } });
          if (tmdbData) {
            if (parsedDirs.length === 0) {
              if (item.mediaType === "tv") {
                parsedDirs = (tmdbData.created_by?.map((c: any) => c.name) || []).slice(0, 3);
              } else {
                parsedDirs = (tmdbData.credits?.crew?.filter((c: any) => c.job === "Director").map((d: any) => d.name) || []).slice(0, 3);
              }
            }
            if (parsedActors.length === 0) {
              parsedActors = (tmdbData.credits?.cast?.slice(0, 6).map((a: any) => a.name) || []);
            }
            if (parsedGenres.length === 0 && tmdbData.genres) {
              parsedGenres = tmdbData.genres.map((g: any) => g.name);
            }
            const runtime = item.runtimeMinutes || (item.mediaType === "tv" ? (tmdbData.episode_run_time?.[0] || 45) : (tmdbData.runtime || 100));
            if (!item.runtimeMinutes) {
              totalMinutes += runtime;
            }
            await db
              .update(mediaItems)
              .set({
                directors: JSON.stringify(parsedDirs),
                actors: JSON.stringify(parsedActors),
                genres: JSON.stringify(parsedGenres),
                runtimeMinutes: runtime,
              })
              .where(eq(mediaItems.id, item.mediaItemId));
          }
        } catch {}
      }

      // Aggregate genres only for watched works
      for (const g of parsedGenres) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }

      // Aggregate directors only for watched works
      for (const d of parsedDirs) {
        if (!directorCounts[d]) {
          directorCounts[d] = { count: 0, works: [] };
        }
        directorCounts[d].count++;
        if (directorCounts[d].works.length < 3 && !directorCounts[d].works.includes(item.title)) {
          directorCounts[d].works.push(item.title);
        }
      }

      // Aggregate actors only for watched works
      for (const a of parsedActors) {
        if (!actorCounts[a]) {
          actorCounts[a] = { count: 0, works: [] };
        }
        actorCounts[a].count++;
        if (actorCounts[a].works.length < 3 && !actorCounts[a].works.includes(item.title)) {
          actorCounts[a].works.push(item.title);
        }
      }
    }

    if (item.userRating !== null && item.userRating !== undefined && item.userRating > 0) {
      ratingsSum += item.userRating;
      ratingsCount++;
    }

    if (item.isFavorite) favoritesCount++;

    // Recent reviews
    if (item.userReview && item.userReview.trim()) {
      recentReviews.push({
        id: item.tmdbId,
        title: item.title,
        year: item.releaseDate ? item.releaseDate.split("-")[0] : "",
        posterPath: item.posterPath,
        rating: item.userRating || 5.0,
        date: item.watchedAt ? new Date(item.watchedAt).toLocaleDateString("fr-FR") : "Récemment",
        review: item.userReview,
      });
    }
  }

  const averageRating = ratingsCount > 0 ? Number((ratingsSum / ratingsCount).toFixed(1)) : 0;
  const hoursWatched = Math.round(totalMinutes / 60);

  // Top genres sorted
  const totalGenres = Object.values(genreCounts).reduce((a, b) => a + b, 0) || 1;
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalGenres) * 100),
    }));

  // Top directors sorted
  const topDirectors = Object.entries(directorCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([name, data]) => ({
      name,
      count: data.count,
      works: data.works.join(", "),
    }));

  // Top actors sorted
  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([name, data]) => ({
      name,
      count: data.count,
      works: data.works.join(", "),
    }));

  return {
    moviesWatched,
    showsWatched,
    averageRating,
    hoursWatched,
    favoritesCount,
    watchlistCount,
    topGenres,
    topDirectors,
    topActors,
    recentReviews,
  };
}

/**
 * Export full user data as JSON (Track format)
 */
export async function exportUserDataAction() {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();

  const library = await db
    .select({
      id: userMedia.id,
      mediaItemId: userMedia.mediaItemId,
      status: userMedia.status,
      isFavorite: userMedia.isFavorite,
      userRating: userMedia.userRating,
      userReview: userMedia.userReview,
      rewatchCount: userMedia.rewatchCount,
      watchedAt: userMedia.watchedAt,
      createdAt: userMedia.createdAt,
      updatedAt: userMedia.updatedAt,
      // Cached media item
      tmdbId: mediaItems.tmdbId,
      mediaType: mediaItems.mediaType,
      title: mediaItems.title,
      originalTitle: mediaItems.originalTitle,
      releaseDate: mediaItems.releaseDate,
      posterPath: mediaItems.posterPath,
      backdropPath: mediaItems.backdropPath,
      voteAverage: mediaItems.voteAverage,
      runtimeMinutes: mediaItems.runtimeMinutes,
      genres: mediaItems.genres,
      directors: mediaItems.directors,
    })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(eq(userMedia.userId, userId))
    .all();

  const episodes = await db
    .select()
    .from(episodeProgress)
    .where(eq(episodeProgress.userId, userId))
    .all();

  return {
    version: "1.0",
    app: "Track",
    exportedAt: new Date().toISOString(),
    library,
    episodes,
  };
}

/**
 * Import Track JSON backup
 */
export async function importUserDataAction(data: {
  version?: string;
  library?: any[];
  episodes?: any[];
}) {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();
  if (!data || !Array.isArray(data.library)) {
    throw new Error("Format de sauvegarde Track invalide.");
  }

  const now = Date.now();
  let count = 0;

  for (const item of data.library) {
    if (!item.tmdbId || !item.mediaType || !item.title) continue;

    let parsedGenres: string[] | undefined = undefined;
    if (item.genres) {
      try {
        parsedGenres = typeof item.genres === "string" ? JSON.parse(item.genres) : item.genres;
      } catch {}
    }

    let parsedDirectors: string[] | undefined = undefined;
    if (item.directors) {
      try {
        parsedDirectors = typeof item.directors === "string" ? JSON.parse(item.directors) : item.directors;
      } catch {}
    }

    const mediaPayload: MediaPayload = {
      tmdbId: Number(item.tmdbId),
      mediaType: item.mediaType === "tv" ? "tv" : "movie",
      title: item.title,
      originalTitle: item.originalTitle || undefined,
      releaseDate: item.releaseDate || undefined,
      posterPath: item.posterPath || null,
      backdropPath: item.backdropPath || null,
      voteAverage: item.voteAverage !== null && item.voteAverage !== undefined ? Number(item.voteAverage) : undefined,
      runtimeMinutes: item.runtimeMinutes !== null && item.runtimeMinutes !== undefined ? Number(item.runtimeMinutes) : undefined,
      genres: parsedGenres,
      directors: parsedDirectors,
    };

    const mediaItemId = await ensureMediaCached(mediaPayload);
    const userMediaId = `${userId}_${mediaItemId}`;

    const existing = await db
      .select()
      .from(userMedia)
      .where(eq(userMedia.id, userMediaId))
      .get();

    const status = item.status || "completed";
    const rating = item.userRating !== null && item.userRating !== undefined ? Number(item.userRating) : null;
    const isFav = item.isFavorite ? 1 : 0;
    const review = item.userReview || null;
    const rewatch = Number(item.rewatchCount || 0);
    const watchedAt = item.watchedAt || (status === "completed" ? new Date().toISOString() : null);

    if (existing) {
      await db
        .update(userMedia)
        .set({
          status,
          userRating: rating,
          userReview: review,
          isFavorite: isFav,
          rewatchCount: rewatch,
          watchedAt,
          updatedAt: now,
        })
        .where(eq(userMedia.id, userMediaId));
    } else {
      await db.insert(userMedia).values({
        id: userMediaId,
        userId,
        mediaItemId,
        status,
        userRating: rating,
        userReview: review,
        isFavorite: isFav,
        rewatchCount: rewatch,
        watchedAt,
        createdAt: item.createdAt || now,
        updatedAt: now,
      });
    }
    count++;
  }

  // Import episode progress if present
  if (Array.isArray(data.episodes)) {
    for (const ep of data.episodes) {
      if (!ep.tmdbTvId || ep.seasonNumber === undefined || ep.episodeNumber === undefined) continue;
      const progressId = `${userId}_tv${ep.tmdbTvId}_s${ep.seasonNumber}_e${ep.episodeNumber}`;
      const existingEp = await db.select().from(episodeProgress).where(eq(episodeProgress.id, progressId)).get();
      if (!existingEp) {
        await db.insert(episodeProgress).values({
          id: progressId,
          userId,
          tmdbTvId: Number(ep.tmdbTvId),
          seasonNumber: Number(ep.seasonNumber),
          episodeNumber: Number(ep.episodeNumber),
          isWatched: 1,
          watchedAt: ep.watchedAt || new Date().toISOString(),
        });
      }
    }
  }

  revalidatePath("/library");
  revalidatePath("/profile");
  return { success: true, count };
}

/**
 * Lightweight RFC 4180-compliant CSV parser
 */
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, "");
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = "";
      if (char === "\r" && clean[i + 1] === "\n") {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const values: string[] = [];
    let cur = "";
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        if (inQ && line[j + 1] === '"') {
          cur += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === "," && !inQ) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    values.push(cur.trim());
    return values;
  };

  const headers = parseRow(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse rating from Letterboxd (supports "4.5", "4", "★★★★½", etc.)
 */
function parseLetterboxdRating(val: string): number | undefined {
  if (!val) return undefined;
  const clean = val.trim();
  if (!clean) return undefined;

  // Star notation
  if (clean.includes("★") || clean.includes("½")) {
    let stars = 0;
    for (const ch of clean) {
      if (ch === "★") stars += 1;
      if (ch === "½") stars += 0.5;
    }
    return stars > 0 ? Math.min(5, Math.max(0.5, stars)) : undefined;
  }

  // Numeric notation
  const num = parseFloat(clean);
  if (!isNaN(num) && num >= 0.5 && num <= 5.0) {
    return Math.round(num * 2) / 2;
  }
  // If 10-scale e.g. 8.5/10
  if (!isNaN(num) && num > 5 && num <= 10) {
    return Math.round((num / 2) * 2) / 2;
  }
  return undefined;
}

/**
 * Import Letterboxd CSV file (watched.csv, diary.csv, ratings.csv, watchlist.csv)
 */
export async function importLetterboxdCsvAction(csvContent: string) {
  await ensureDbInitialized();
  const { headers, rows } = parseCSV(csvContent);

  if (rows.length === 0) {
    throw new Error("Le fichier CSV est vide ou non reconnu.");
  }

  // Find column names
  const nameCol = headers.find((h) => h === "name" || h === "title" || h.includes("film") || h.includes("movie")) || headers[0];
  const yearCol = headers.find((h) => h === "year" || h.includes("release"));
  const ratingCol = headers.find((h) => h === "rating" || h.includes("note") || h.includes("score"));
  const dateCol = headers.find((h) => h === "watched date" || h === "watched_date" || h === "date");
  const isWatchlist = headers.some((h) => h.includes("uri") && !ratingCol && !dateCol);

  let importedCount = 0;
  let skippedCount = 0;

  // Process rows with concurrency limit
  const limit = Math.min(rows.length, 300); // cap to 300 per file for fast mobile import

  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    const title = row[nameCol]?.trim();
    if (!title) {
      skippedCount++;
      continue;
    }

    const year = yearCol ? row[yearCol]?.trim() : undefined;
    const ratingStr = ratingCol ? row[ratingCol]?.trim() : "";
    const rating = ratingStr ? parseLetterboxdRating(ratingStr) : undefined;
    const watchedDate = dateCol ? row[dateCol]?.trim() : undefined;

    try {
      const match = await searchMovieExact(title, year);
      if (match) {
        const mediaPayload: MediaPayload = {
          tmdbId: match.id,
          mediaType: "movie",
          title: match.title || title,
          originalTitle: match.original_title,
          releaseDate: match.release_date,
          posterPath: match.poster_path,
          backdropPath: match.backdrop_path,
          voteAverage: match.vote_average,
        };

        const status: WatchStatus = isWatchlist && !rating ? "watchlist" : "completed";

        await saveUserMediaAction(mediaPayload, {
          status,
          rating,
          watchedAt: watchedDate || (status === "completed" ? new Date().toISOString() : undefined),
        });

        importedCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.error(`Erreur import film Letterboxd "${title}":`, err);
      skippedCount++;
    }
  }

  revalidatePath("/library");
  revalidatePath("/profile");

  return {
    success: true,
    totalParsed: rows.length,
    importedCount,
    skippedCount,
  };
}

/**
 * Server action pour récupérer le logo officiel d'un média
 */
export async function getMediaLogoAction(
  mediaType: "movie" | "tv",
  tmdbId: number
): Promise<string | null> {
  return getMediaLogo(mediaType, tmdbId);
}

export interface WatchingShowItem {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  watchedEpisodesCount: number;
  lastSeason?: number;
  lastEpisode?: number;
}

export interface PersonalizedRecommendationsData {
  seedTitle: string;
  seedRating?: number;
  seedMediaType: "movie" | "tv";
  items: any[];
}

export interface HomeFeedData {
  watchingShows: WatchingShowItem[];
  recommendations: PersonalizedRecommendationsData | null;
}

/**
 * Récupère le flux personnalisé pour l'accueil (séries en cours & recommandations sur-mesure)
 */
export async function getUserHomeFeedAction(): Promise<HomeFeedData> {
  await ensureDbInitialized();
  const userId = await getCurrentUserId();

  // 1. Séries en cours de visionnage
  const watchingRows = await db
    .select({
      tmdbId: mediaItems.tmdbId,
      mediaType: mediaItems.mediaType,
      title: mediaItems.title,
      posterPath: mediaItems.posterPath,
      backdropPath: mediaItems.backdropPath,
      status: userMedia.status,
    })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(mediaItems.mediaType, "tv"),
        eq(userMedia.status, "watching")
      )
    )
    .all();

  const watchingShows: WatchingShowItem[] = [];

  for (const show of watchingRows) {
    const episodes = await db
      .select({
        seasonNumber: episodeProgress.seasonNumber,
        episodeNumber: episodeProgress.episodeNumber,
      })
      .from(episodeProgress)
      .where(
        and(
          eq(episodeProgress.userId, userId),
          eq(episodeProgress.tmdbTvId, show.tmdbId),
          eq(episodeProgress.isWatched, 1)
        )
      )
      .orderBy(desc(episodeProgress.seasonNumber), desc(episodeProgress.episodeNumber))
      .all();

    watchingShows.push({
      id: show.tmdbId,
      title: show.title,
      posterPath: show.posterPath,
      backdropPath: show.backdropPath,
      watchedEpisodesCount: episodes.length,
      lastSeason: episodes[0]?.seasonNumber,
      lastEpisode: episodes[0]?.episodeNumber,
    });
  }

  // 2. Recommandations personnalisées
  let recommendations: PersonalizedRecommendationsData | null = null;
  try {
    const topRatedMedia = await db
      .select({
        tmdbId: mediaItems.tmdbId,
        mediaType: mediaItems.mediaType,
        title: mediaItems.title,
        rating: userMedia.userRating,
        isFavorite: userMedia.isFavorite,
      })
      .from(userMedia)
      .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
      .where(
        and(
          eq(userMedia.userId, userId),
          sql`(${userMedia.userRating} >= 3.5 OR ${userMedia.isFavorite} = 1)`
        )
      )
      .orderBy(desc(userMedia.userRating), desc(userMedia.updatedAt))
      .limit(1)
      .get();

    if (topRatedMedia) {
      const recRes = await getRecommendations(
        topRatedMedia.mediaType as "movie" | "tv",
        topRatedMedia.tmdbId
      ).catch(() => null);

      if (recRes?.results && recRes.results.length > 0) {
        recommendations = {
          seedTitle: topRatedMedia.title,
          seedRating: topRatedMedia.rating ?? undefined,
          seedMediaType: topRatedMedia.mediaType as "movie" | "tv",
          items: recRes.results.slice(0, 10),
        };
      }
    }

    // Fallback chefs-d'œuvre généraux si pas encore de note
    if (!recommendations) {
      const topGeneral = await getTopRated("movie", 1).catch(() => null);
      if (topGeneral?.results && topGeneral.results.length > 0) {
        recommendations = {
          seedTitle: "Les Incontournables du 7e Art",
          seedMediaType: "movie",
          items: topGeneral.results.slice(0, 10),
        };
      }
    }
  } catch (err) {
    console.warn("Could not generate recommendations:", err);
  }

  return {
    watchingShows,
    recommendations,
  };
}

