import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getNowPlayingMovies,
  getMediaLogo,
} from "@/lib/tmdb/client";
import { getUserHomeFeedAction } from "@/lib/db/actions";
import { getCurrentUser } from "@/lib/auth";
import { DiscoverClient } from "@/components/discover/DiscoverClient";
import type { TMDBSearchResultItem, TMDBMovieRaw, TMDBTVShowRaw } from "@/types/tmdb";

// Fallback items in case of network issues
const FALLBACK_TRENDING: TMDBSearchResultItem[] = [
  {
    id: 693134,
    media_type: "movie",
    title: "Dune : Deuxième Partie",
    release_date: "2024-02-28",
    poster_path: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg",
    logo_path: "/tzMKt98RSQFzQ3yuVqCEhAqcM3K.png",
    vote_average: 8.2,
    vote_count: 5120,
    overview: "Paul Atreides s'unit à Chani et aux Fremen tout en préparant sa revanche...",
  },
  {
    id: 872585,
    media_type: "movie",
    title: "Oppenheimer",
    release_date: "2023-07-19",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "/rLb2cw69Pazuxaj0sRXQ037tGI1.jpg",
    logo_path: "/bF2E14LqCgDq5a6s0dK7x4b9P2f.png",
    vote_average: 8.1,
    vote_count: 8900,
    overview: "L'histoire de J. Robert Oppenheimer et du projet Manhattan...",
  },
];

export const dynamic = "force-dynamic";

export default async function Page() {
  let currentUser = null;
  let trendingItems: TMDBSearchResultItem[] = FALLBACK_TRENDING;
  let popularMovies: TMDBMovieRaw[] = [];
  let popularShows: TMDBTVShowRaw[] = [];
  let nowPlayingMovies: TMDBMovieRaw[] = [];
  let homeFeed = { watchingShows: [], recommendations: null };

  try {
    const [userRes, trendingRes, moviesRes, showsRes, nowPlayingRes, feedRes] = await Promise.all([
      getCurrentUser().catch(() => null),
      getTrending("all", "week"),
      getPopularMovies(1),
      getPopularTVShows(1),
      getNowPlayingMovies(1).catch(() => ({ results: [] })),
      getUserHomeFeedAction().catch(() => ({ watchingShows: [], recommendations: null })),
    ]);

    currentUser = userRes;

    if (trendingRes?.results?.length) {
      trendingItems = await Promise.all(
        trendingRes.results.map(async (item, idx) => {
          if (idx < 6) {
            const mediaType = item.media_type === "tv" ? "tv" : "movie";
            const logoPath = await getMediaLogo(mediaType, item.id);
            return { ...item, logo_path: logoPath };
          }
          return item;
        })
      );
    }
    if (moviesRes?.results?.length) {
      popularMovies = moviesRes.results;
    }
    if (showsRes?.results?.length) {
      popularShows = showsRes.results;
    }
    if (nowPlayingRes?.results?.length) {
      nowPlayingMovies = nowPlayingRes.results;
    }
    if (feedRes) {
      homeFeed = feedRes as any;
    }
  } catch (error) {
    console.warn("Could not fetch TMDB live data at build time, using cached data:", error);
  }

  return (
    <DiscoverClient
      currentUser={currentUser}
      trendingItems={trendingItems}
      popularMovies={popularMovies}
      popularShows={popularShows}
      nowPlayingMovies={nowPlayingMovies}
      homeFeed={homeFeed}
    />
  );
}
