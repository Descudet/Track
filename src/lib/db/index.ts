import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbUrl =
  process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:track.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

export const db = drizzle(client, { schema });

// Auto-initialize SQLite tables if not present
let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    );
  `);

  // Safe migration for existing users table
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN email TEXT;`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN updated_at INTEGER;`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE media_items ADD COLUMN actors TEXT;`);
  } catch {}

  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      tmdb_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      original_title TEXT,
      release_date TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      vote_average REAL,
      runtime_minutes INTEGER,
      genres TEXT,
      directors TEXT,
      actors TEXT,
      cached_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_media (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      media_item_id TEXT NOT NULL,
      status TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      user_rating REAL,
      user_review TEXT,
      rewatch_count INTEGER NOT NULL DEFAULT 0,
      watched_at TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS watch_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      media_item_id TEXT NOT NULL,
      watched_date TEXT NOT NULL,
      notes TEXT,
      rating REAL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS episode_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tmdb_tv_id INTEGER NOT NULL,
      season_number INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      is_watched INTEGER NOT NULL DEFAULT 1,
      watched_at TEXT NOT NULL
    );
  `);

  // Ensure default user exists
  const existingUser = await client.execute({
    sql: "SELECT id FROM users WHERE id = ?",
    args: ["default_user"],
  });

  if (existingUser.rows.length === 0) {
    const now = Date.now();
    await client.execute({
      sql: "INSERT INTO users (id, display_name, created_at) VALUES (?, ?, ?)",
      args: ["default_user", "Cinéphile", now],
    });

    // Seed initial cinéphile entries for an instant premium experience
    const initialItems = [
      {
        id: "movie_693134",
        tmdbId: 693134,
        mediaType: "movie",
        title: "Dune : Deuxième Partie",
        originalTitle: "Dune: Part Two",
        releaseDate: "2024-02-28",
        posterPath: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
        backdropPath: "/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg",
        voteAverage: 8.2,
        runtimeMinutes: 166,
        genres: JSON.stringify(["Science-Fiction", "Aventure"]),
        directors: JSON.stringify(["Denis Villeneuve"]),
        actors: JSON.stringify(["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"]),
        userRating: 4.5,
        userReview: "Une claque visuelle et sonore absolue. Hans Zimmer au sommet.",
        status: "completed",
        isFavorite: 1,
        rewatchCount: 2,
      },
      {
        id: "movie_872585",
        tmdbId: 872585,
        mediaType: "movie",
        title: "Oppenheimer",
        originalTitle: "Oppenheimer",
        releaseDate: "2023-07-19",
        posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        backdropPath: "/rLb2cw69Pazuxaj0sRXQ037tGI1.jpg",
        voteAverage: 8.1,
        runtimeMinutes: 180,
        genres: JSON.stringify(["Drame", "Histoire"]),
        directors: JSON.stringify(["Christopher Nolan"]),
        actors: JSON.stringify(["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."]),
        userRating: 5.0,
        userReview: "Un chef d'œuvre d'écriture et de montage historique. Cillian Murphy impérial.",
        status: "completed",
        isFavorite: 1,
        rewatchCount: 1,
      },
      {
        id: "movie_157336",
        tmdbId: 157336,
        mediaType: "movie",
        title: "Interstellar",
        originalTitle: "Interstellar",
        releaseDate: "2014-11-05",
        posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        backdropPath: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
        voteAverage: 8.4,
        runtimeMinutes: 169,
        genres: JSON.stringify(["Science-Fiction", "Drame"]),
        directors: JSON.stringify(["Christopher Nolan"]),
        actors: JSON.stringify(["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"]),
        userRating: 4.5,
        userReview: "Le sommet de la science-fiction émotionnelle.",
        status: "completed",
        isFavorite: 1,
        rewatchCount: 3,
      },
      {
        id: "tv_93405",
        tmdbId: 93405,
        mediaType: "tv",
        title: "Squid Game",
        originalTitle: "오징어 게임",
        releaseDate: "2021-09-17",
        posterPath: "/heV89pC6pv5fz1plikfyQxYuE4L.jpg",
        backdropPath: "/2meX1nMdScFOoV4370rqHWKmXhY.jpg",
        voteAverage: 7.8,
        runtimeMinutes: 55,
        genres: JSON.stringify(["Drame", "Mystère"]),
        directors: JSON.stringify(["Hwang Dong-hyuk"]),
        actors: JSON.stringify(["Lee Jung-jae", "Park Hae-soo", "Wi Ha-joon", "Jung Ho-yeon"]),
        userRating: 4.0,
        userReview: "Tension magistrale.",
        status: "watching",
        isFavorite: 0,
        rewatchCount: 0,
      },
      {
        id: "tv_119051",
        tmdbId: 119051,
        mediaType: "tv",
        title: "Mercredi",
        originalTitle: "Wednesday",
        releaseDate: "2022-11-23",
        posterPath: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
        backdropPath: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",
        voteAverage: 8.0,
        runtimeMinutes: 50,
        genres: JSON.stringify(["Comédie", "Fantastique"]),
        directors: JSON.stringify(["Tim Burton"]),
        actors: JSON.stringify(["Jenna Ortega", "Gwendoline Christie", "Emma Myers", "Hunter Doohan"]),
        userRating: null,
        userReview: null,
        status: "watchlist",
        isFavorite: 0,
        rewatchCount: 0,
      },
    ];

    for (const item of initialItems) {
      await client.execute({
        sql: `INSERT INTO media_items (id, tmdb_id, media_type, title, original_title, release_date, poster_path, backdrop_path, vote_average, runtime_minutes, genres, directors, actors, cached_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          item.id,
          item.tmdbId,
          item.mediaType,
          item.title,
          item.originalTitle,
          item.releaseDate,
          item.posterPath,
          item.backdropPath,
          item.voteAverage,
          item.runtimeMinutes,
          item.genres,
          item.directors,
          item.actors,
          now,
        ],
      });

      await client.execute({
        sql: `INSERT INTO user_media (id, user_id, media_item_id, status, is_favorite, user_rating, user_review, rewatch_count, watched_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `default_user_${item.id}`,
          "default_user",
          item.id,
          item.status,
          item.isFavorite,
          item.userRating,
          item.userReview,
          item.rewatchCount,
          item.status === "completed" ? "2024-03-01T20:00:00.000Z" : null,
          now,
          now,
        ],
      });
    }
  }

  isInitialized = true;
}
