import type {
  TMDBMovieRaw,
  TMDBTVShowRaw,
  TMDBPersonRaw,
  TMDBCollectionRaw,
  TMDBCompanyRaw,
  TMDBSearchResultItem,
  TMDBPaginatedResponse,
  TMDBGenre,
  TMDBImageLogo,
} from "@/types/tmdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error(
      "TMDB_API_KEY n'est pas définie dans l'environnement. Veuillez vérifier votre fichier .env.local."
    );
  }
  return key;
}

interface FetchOptions {
  params?: Record<string, string | number | undefined>;
  revalidate?: number; // cache duration in seconds
}

export async function fetchTMDB<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const apiKey = getApiKey();
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "fr-FR");

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const revalidate = options.revalidate ?? 86400; // default 24h cache

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(
      `Erreur TMDB (${res.status}) sur ${endpoint}: ${errorBody || res.statusText}`
    );
  }

  return (await res.json()) as T;
}

/**
 * Tendances hebdomadaires ou quotidiennes
 */
export async function getTrending(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "week",
  page = 1
): Promise<TMDBPaginatedResponse<TMDBSearchResultItem>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBSearchResultItem>>(
    `/trending/${mediaType}/${timeWindow}`,
    {
      params: { page },
      revalidate: 21600, // 6 heures
    }
  );
}

/**
 * Films populaires
 */
export async function getPopularMovies(
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovieRaw>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBMovieRaw>>("/movie/popular", {
    params: { page },
    revalidate: 43200, // 12 heures
  });
}

/**
 * Séries populaires
 */
export async function getPopularTVShows(
  page = 1
): Promise<TMDBPaginatedResponse<TMDBTVShowRaw>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBTVShowRaw>>("/tv/popular", {
    params: { page },
    revalidate: 43200,
  });
}

/**
 * Films actuellement au cinéma
 */
export async function getNowPlayingMovies(
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovieRaw>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBMovieRaw>>("/movie/now_playing", {
    params: { page },
    revalidate: 21600,
  });
}

/**
 * Les mieux notés
 */
export async function getTopRated(
  mediaType: "movie" | "tv",
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovieRaw | TMDBTVShowRaw>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBMovieRaw | TMDBTVShowRaw>>(
    `/${mediaType}/top_rated`,
    {
      params: { page },
      revalidate: 86400, // 24h
    }
  );
}

/**
 * Recommandations basées sur une œuvre
 */
export async function getRecommendations(
  mediaType: "movie" | "tv",
  id: number
): Promise<TMDBPaginatedResponse<TMDBSearchResultItem>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBSearchResultItem>>(
    `/${mediaType}/${id}/recommendations`,
    {
      params: { page: 1 },
      revalidate: 43200, // 12h
    }
  );
}

/**
 * Recherche instantanée multi-critères (films, séries, personnes)
 */
export async function searchMulti(
  query: string,
  page = 1
): Promise<TMDBPaginatedResponse<TMDBSearchResultItem>> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  return fetchTMDB<TMDBPaginatedResponse<TMDBSearchResultItem>>(
    "/search/multi",
    {
      params: {
        query: query.trim(),
        page,
        include_adult: "false",
      },
      revalidate: 3600, // 1h pour les termes fréquents
    }
  );
}

/**
 * Détails complets d'un film avec casting, vidéos et plateformes de streaming
 */
export async function getMovieDetails(id: number): Promise<TMDBMovieRaw> {
  return fetchTMDB<TMDBMovieRaw>(`/movie/${id}`, {
    params: {
      append_to_response:
        "credits,videos,recommendations,similar,watch/providers,release_dates,images",
      include_image_language: "fr,en,null",
    },
    revalidate: 86400 * 3, // 3 jours
  });
}

/**
 * Détails complets d'une série avec casting, saisons, vidéos et streaming
 */
export async function getTVShowDetails(id: number): Promise<TMDBTVShowRaw> {
  return fetchTMDB<TMDBTVShowRaw>(`/tv/${id}`, {
    params: {
      append_to_response:
        "credits,videos,recommendations,similar,watch/providers,content_ratings,images",
      include_image_language: "fr,en,null",
    },
    revalidate: 86400 * 3,
  });
}

/**
 * Détails d'une personne (acteur / réalisateur) avec sa filmographie complète
 */
export async function getPersonDetails(id: number): Promise<TMDBPersonRaw> {
  return fetchTMDB<TMDBPersonRaw>(`/person/${id}`, {
    params: {
      append_to_response: "combined_credits,images",
    },
    revalidate: 86400 * 7, // 7 jours
  });
}

/**
 * Détails d'un studio / société de production
 */
export async function getCompanyDetails(id: number): Promise<TMDBCompanyRaw> {
  return fetchTMDB<TMDBCompanyRaw>(`/company/${id}`, {
    revalidate: 86400 * 30, // 30 jours
  });
}

/**
 * Détails d'une saga / collection
 */
export async function getCollectionDetails(id: number): Promise<TMDBCollectionRaw> {
  return fetchTMDB<TMDBCollectionRaw>(`/collection/${id}`, {
    revalidate: 86400 * 14,
  });
}

/**
 * Liste des genres disponibles
 */
export async function getGenres(
  mediaType: "movie" | "tv"
): Promise<{ genres: TMDBGenre[] }> {
  return fetchTMDB<{ genres: TMDBGenre[] }>(`/genre/${mediaType}/list`, {
    revalidate: 86400 * 30,
  });
}

/**
 * Découverte par genre
 */
export async function discoverByGenre(
  mediaType: "movie" | "tv",
  genreId: number,
  page = 1
): Promise<TMDBPaginatedResponse<TMDBSearchResultItem>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBSearchResultItem>>(
    `/discover/${mediaType}`,
    {
      params: {
        with_genres: genreId,
        page,
        sort_by: "popularity.desc",
      },
      revalidate: 43200,
    }
  );
}

/**
 * Détails complets d'une saison de série TV
 */
export async function getSeasonDetails(
  tvId: number,
  seasonNumber: number
): Promise<{
  id: number;
  name: string;
  season_number: number;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episodes: {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string | null;
    runtime: number | null;
    vote_average: number;
  }[];
}> {
  return fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`, {
    revalidate: 86400 * 7,
  });
}

/**
 * Découverte par studio / société de production
 */
export async function discoverByCompany(
  companyId: number,
  mediaType: "movie" | "tv" = "movie",
  page = 1
): Promise<TMDBPaginatedResponse<TMDBSearchResultItem>> {
  return fetchTMDB<TMDBPaginatedResponse<TMDBSearchResultItem>>(
    `/discover/${mediaType}`,
    {
      params: {
        with_companies: companyId,
        page,
        sort_by: "popularity.desc",
      },
      revalidate: 43200,
    }
  );
}

/**
 * Recherche spécifique de film par titre et année (utile pour imports Letterboxd)
 */
export async function searchMovieExact(
  title: string,
  year?: string | number
): Promise<TMDBMovieRaw | null> {
  const params: Record<string, string | number | undefined> = {
    query: title.trim(),
    include_adult: "false",
    page: 1,
  };
  if (year) {
    params.primary_release_year = String(year);
  }

  try {
    const res = await fetchTMDB<TMDBPaginatedResponse<TMDBMovieRaw>>("/search/movie", {
      params,
      revalidate: 86400,
    });

    if (res.results && res.results.length > 0) {
      return res.results[0];
    }

    // Fallback sans année si aucune correspondance exacte
    if (year) {
      const fallback = await fetchTMDB<TMDBPaginatedResponse<TMDBMovieRaw>>("/search/movie", {
        params: { query: title.trim(), page: 1 },
        revalidate: 86400,
      });
      if (fallback.results && fallback.results.length > 0) {
        return fallback.results[0];
      }
    }
  } catch (err) {
    console.error(`Erreur recherche TMDB pour "${title}":`, err);
  }

  return null;
}

import { getBestLogo } from "./utils";
export { getBestLogo };

/**
 * Récupère le meilleur logo pour un média (film ou série)
 */
export async function getMediaLogo(
  mediaType: "movie" | "tv",
  id: number
): Promise<string | null> {
  try {
    const res = await fetchTMDB<{ logos?: TMDBImageLogo[] }>(
      `/${mediaType}/${id}/images`,
      {
        params: {
          include_image_language: "fr,en,null",
        },
        revalidate: 86400 * 7,
      }
    );
    return getBestLogo(res.logos);
  } catch {
    return null;
  }
}
