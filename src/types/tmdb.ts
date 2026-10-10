export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCast {
  id: number;
  name: string;
  original_name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string; // "YouTube"
  type: string; // "Trailer", "Teaser", etc.
  official: boolean;
  published_at: string;
}

export interface TMDBProviderItem {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBWatchProviderCountry {
  link?: string;
  flatrate?: TMDBProviderItem[];
  rent?: TMDBProviderItem[];
  buy?: TMDBProviderItem[];
}

export interface TMDBImageLogo {
  aspect_ratio: number;
  height: number;
  width: number;
  file_path: string;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBImagesResponse {
  backdrops?: { file_path: string }[];
  logos?: TMDBImageLogo[];
  posters?: { file_path: string }[];
}

export interface TMDBMovieRaw {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genres?: TMDBGenre[];
  tagline?: string;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  production_companies?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  credits?: {
    cast: TMDBCast[];
    crew: TMDBCrew[];
  };
  videos?: {
    results: TMDBVideo[];
  };
  "watch/providers"?: {
    results: Record<string, TMDBWatchProviderCountry>;
  };
  images?: TMDBImagesResponse;
}

export interface TMDBTVShowRaw {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genres?: TMDBGenre[];
  tagline?: string;
  created_by?: { id: number; name: string; profile_path: string | null }[];
  production_companies?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  credits?: {
    cast: TMDBCast[];
    crew: TMDBCrew[];
  };
  videos?: {
    results: TMDBVideo[];
  };
  "watch/providers"?: {
    results: Record<string, TMDBWatchProviderCountry>;
  };
  images?: TMDBImagesResponse;
  seasons?: {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string | null;
    episode_count: number;
  }[];
}

export interface TMDBPersonRaw {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  combined_credits?: {
    cast: (TMDBMovieRaw & { media_type: "movie" | "tv"; character?: string })[];
    crew: (TMDBMovieRaw & { media_type: "movie" | "tv"; job?: string; department?: string })[];
  };
}

export interface TMDBCollectionRaw {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: (TMDBMovieRaw & { media_type?: "movie" })[];
}

export interface TMDBCompanyRaw {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBSearchResultItem {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  logo_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  adult?: boolean;
  known_for_department?: string;
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
