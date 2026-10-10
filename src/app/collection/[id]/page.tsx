import { notFound } from "next/navigation";
import { getCollectionDetails } from "@/lib/tmdb/client";
import { CollectionDetailClient } from "@/components/detail/CollectionDetailClient";
import type { Metadata } from "next";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const collection = await getCollectionDetails(Number(id));
    return {
      title: `${collection.name} • Track`,
      description: collection.overview || "Saga cinématographique sur Track",
    };
  } catch {
    return {
      title: "Collection • Track",
    };
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const collectionId = Number(id);

  if (isNaN(collectionId)) {
    notFound();
  }

  try {
    const collection = await getCollectionDetails(collectionId);
    return <CollectionDetailClient collection={collection} />;
  } catch (error) {
    console.error("Error loading collection:", error);
    notFound();
  }
}
