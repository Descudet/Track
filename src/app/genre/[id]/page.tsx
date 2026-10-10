import { notFound } from "next/navigation";
import { discoverByGenre, getGenres } from "@/lib/tmdb/client";
import { GenreDetailClient } from "@/components/detail/GenreDetailClient";
import type { Metadata } from "next";

interface GenrePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; name?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: GenrePageProps): Promise<Metadata> {
  const { id } = await params;
  const { name } = await searchParams;
  const genreId = Number(id);

  let titleName = name;
  if (!titleName) {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        getGenres("movie"),
        getGenres("tv"),
      ]);
      const match =
        movieGenres.genres.find((g) => g.id === genreId) ||
        tvGenres.genres.find((g) => g.id === genreId);
      if (match) titleName = match.name;
    } catch {}
  }

  return {
    title: `${titleName || "Genre"} • Track`,
    description: `Découvrez les meilleurs films et séries du genre ${titleName || ""}`,
  };
}

export default async function GenrePage({
  params,
  searchParams,
}: GenrePageProps) {
  const { id } = await params;
  const { type, name } = await searchParams;
  const genreId = Number(id);

  if (isNaN(genreId)) {
    notFound();
  }

  try {
    let genreName = name;
    if (!genreName) {
      const [movieGenres, tvGenres] = await Promise.all([
        getGenres("movie").catch(() => ({ genres: [] })),
        getGenres("tv").catch(() => ({ genres: [] })),
      ]);
      const match =
        movieGenres.genres.find((g) => g.id === genreId) ||
        tvGenres.genres.find((g) => g.id === genreId);
      genreName = match?.name || "Genre";
    }

    const [moviesRes, showsRes] = await Promise.all([
      discoverByGenre("movie", genreId).catch(() => ({ results: [] })),
      discoverByGenre("tv", genreId).catch(() => ({ results: [] })),
    ]);

    const initialMediaType = type === "tv" ? "tv" : "movie";

    return (
      <GenreDetailClient
        genreId={genreId}
        genreName={genreName}
        initialMediaType={initialMediaType}
        movies={moviesRes.results || []}
        shows={showsRes.results || []}
      />
    );
  } catch (error) {
    console.error("Error loading genre:", error);
    notFound();
  }
}
