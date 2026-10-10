import { NextRequest, NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb/client";
import type { TMDBSearchResultItem } from "@/types/tmdb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const sortBy = searchParams.get("sortBy") || "popularity"; // 'popularity' | 'rating' | 'date' | 'relevance'
    const hideNoPoster = searchParams.get("hideNoPoster") !== "false"; // default true
    const minVotes = parseInt(searchParams.get("minVotes") || "0", 10);

    if (!query.trim()) {
      return NextResponse.json({
        movies: [],
        tvShows: [],
        people: [],
        totalResults: 0,
      });
    }

    const data = await searchMulti(query, page);

    const filterItem = (item: TMDBSearchResultItem) => {
      // Exclude adult content
      if (item.adult) return false;

      // Filter out items without posters if requested
      if (hideNoPoster && !item.poster_path && !item.backdrop_path) {
        return false;
      }

      // Filter out 0-vote noise with very low popularity
      if ((item.vote_count ?? 0) < minVotes) {
        return false;
      }

      return true;
    };

    const sortItems = (a: TMDBSearchResultItem, b: TMDBSearchResultItem) => {
      if (sortBy === "rating") {
        const ratingDiff = (b.vote_average || 0) - (a.vote_average || 0);
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        return (b.vote_count || 0) - (a.vote_count || 0);
      }
      if (sortBy === "date") {
        const dateA = a.release_date || a.first_air_date || "";
        const dateB = b.release_date || b.first_air_date || "";
        return dateB.localeCompare(dateA);
      }
      if (sortBy === "popularity") {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      // Default: relevance with popularity weighting
      return (
        (b.popularity || 0) * ((b.vote_count || 0) > 0 ? 1.2 : 0.8) -
        (a.popularity || 0) * ((a.vote_count || 0) > 0 ? 1.2 : 0.8)
      );
    };

    // Filter and group results
    const movies = data.results
      .filter((item) => item.media_type === "movie" && filterItem(item))
      .sort(sortItems);

    const tvShows = data.results
      .filter((item) => item.media_type === "tv" && filterItem(item))
      .sort(sortItems);

    const people = data.results
      .filter((item) => {
        if (item.media_type !== "person") return false;
        if (hideNoPoster && !item.profile_path) return false;
        return true;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return NextResponse.json({
      movies,
      tvShows,
      people,
      totalResults: movies.length + tvShows.length + people.length,
      page: data.page,
      totalPages: data.total_pages,
    });
  } catch (error) {
    console.error("Search API route error:", error);
    return NextResponse.json(
      { error: "Échec de la recherche TMDB" },
      { status: 500 }
    );
  }
}
