import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // Session token
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const mediaItems = sqliteTable("media_items", {
  id: text("id").primaryKey(), // e.g. "movie_693134" or "tv_93405"
  tmdbId: integer("tmdb_id").notNull(),
  mediaType: text("media_type").notNull(), // "movie" | "tv"
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  releaseDate: text("release_date"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  voteAverage: real("vote_average"),
  runtimeMinutes: integer("runtime_minutes"),
  genres: text("genres"), // JSON array of string
  directors: text("directors"), // JSON array of string
  actors: text("actors"), // JSON array of string
  cachedAt: integer("cached_at").notNull(),
});

export const userMedia = sqliteTable("user_media", {
  id: text("id").primaryKey(), // e.g. "${userId}_${mediaItemId}"
  userId: text("user_id").notNull(),
  mediaItemId: text("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  status: text("status").notNull(), // "watchlist" | "watching" | "completed" | "dropped"
  isFavorite: integer("is_favorite").notNull().default(0), // 0 or 1
  userRating: real("user_rating"), // 0.5 to 5.0
  userReview: text("user_review"),
  rewatchCount: integer("rewatch_count").notNull().default(0),
  watchedAt: text("watched_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const watchLogs = sqliteTable("watch_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  mediaItemId: text("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  watchedDate: text("watched_date").notNull(),
  notes: text("notes"),
  rating: real("rating"),
  createdAt: integer("created_at").notNull(),
});

export const episodeProgress = sqliteTable("episode_progress", {
  id: text("id").primaryKey(), // "${userId}_tv${tmdbTvId}_s${season}_e${episode}"
  userId: text("user_id").notNull(),
  tmdbTvId: integer("tmdb_tv_id").notNull(),
  seasonNumber: integer("season_number").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  isWatched: integer("is_watched").notNull().default(1),
  watchedAt: text("watched_at").notNull(),
});
