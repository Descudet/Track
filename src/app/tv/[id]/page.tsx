import { notFound } from "next/navigation";
import { getTVShowDetails, getSeasonDetails } from "@/lib/tmdb/client";
import { TVDetailClient } from "@/components/detail/TVDetailClient";
import type { Metadata } from "next";

interface TVPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TVPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const show = await getTVShowDetails(Number(id));
    return {
      title: `${show.name} • Track`,
      description: show.overview || "Fiche série sur Track",
    };
  } catch {
    return {
      title: "Série • Track",
    };
  }
}

export default async function TVPage({ params }: TVPageProps) {
  const { id } = await params;
  const tvId = Number(id);

  if (isNaN(tvId)) {
    notFound();
  }

  try {
    const show = await getTVShowDetails(tvId);
    let initialSeasonEpisodes: any[] = [];
    try {
      const season1 = await getSeasonDetails(tvId, 1);
      initialSeasonEpisodes = season1.episodes || [];
    } catch {
      // Season 1 fallback
    }

    return (
      <TVDetailClient
        show={show}
        initialSeasonEpisodes={initialSeasonEpisodes}
      />
    );
  } catch (error) {
    console.error("Error loading TV show:", error);
    notFound();
  }
}
