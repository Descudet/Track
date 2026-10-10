export type MediaType = "movie" | "tv";

export type WatchStatus = "watchlist" | "watching" | "completed" | "dropped";

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

export interface Studio {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry: string;
}

export interface Movie {
  id: number;
  mediaType: "movie";
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string; // YYYY-MM-DD
  runtime: number; // minutes
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number; // TMDB rating 0-10
  voteCount: number;
  genres: Genre[];
  tagline?: string;
  director?: string;
  cast?: CastMember[];
  studios?: Studio[];
  collectionId?: number | null;
  collectionName?: string | null;
}

export interface TVEpisode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  stillPath: string | null;
  runtime?: number;
  voteAverage?: number;
}

export interface TVSeason {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string | null;
  episodeCount: number;
  episodes?: TVEpisode[];
}

export interface TVShow {
  id: number;
  mediaType: "tv";
  title: string; // TMDB name
  originalTitle: string;
  overview: string;
  firstAirDate: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  creator?: string;
  cast?: CastMember[];
  studios?: Studio[];
  seasons?: TVSeason[];
}

export type MediaItem = Movie | TVShow;

export interface UserLibraryItem {
  mediaId: number;
  mediaType: MediaType;
  status: WatchStatus;
  isFavorite: boolean;
  rating?: number; // 0.5 to 5.0 with 0.5 step
  review?: string; // Private personal review
  watchedAt?: string; // ISO string
  reWatchCount?: number;
  updatedAt: string;
  // Minimal cached snapshot for offline/instant UI rendering
  cachedTitle: string;
  cachedPosterPath: string | null;
  cachedYear: string;
}
