import { notFound } from "next/navigation";
import { getPersonDetails } from "@/lib/tmdb/client";
import { PersonDetailClient } from "@/components/detail/PersonDetailClient";
import type { Metadata } from "next";

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const person = await getPersonDetails(Number(id));
    return {
      title: `${person.name} • Track`,
      description: person.biography
        ? person.biography.slice(0, 150)
        : "Filmographie sur Track",
    };
  } catch {
    return {
      title: "Artiste • Track",
    };
  }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const personId = Number(id);

  if (isNaN(personId)) {
    notFound();
  }

  try {
    const person = await getPersonDetails(personId);
    return <PersonDetailClient person={person} />;
  } catch (error) {
    console.error("Error loading person:", error);
    notFound();
  }
}
