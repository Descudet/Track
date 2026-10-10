import { notFound } from "next/navigation";
import { getMovieDetails } from "@/lib/tmdb/client";
import { MovieDetailClient } from "@/components/detail/MovieDetailClient";
import type { Metadata } from "next";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(Number(id));
    return {
      title: `${movie.title} • Track`,
      description: movie.overview || "Fiche cinéma sur Track",
    };
  } catch {
    return {
      title: "Film • Track",
    };
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const movieId = Number(id);

  if (isNaN(movieId)) {
    notFound();
  }

  try {
    const movie = await getMovieDetails(movieId);
    const similarMovies =
      movie.credits && "recommendations" in movie
        ? (movie as any).recommendations?.results || []
        : [];

    return <MovieDetailClient movie={movie} similarMovies={similarMovies} />;
  } catch (error) {
    console.error("Error loading movie:", error);
    notFound();
  }
}
