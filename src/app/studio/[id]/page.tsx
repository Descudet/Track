import { notFound } from "next/navigation";
import { getCompanyDetails, discoverByCompany } from "@/lib/tmdb/client";
import { StudioDetailClient } from "@/components/detail/StudioDetailClient";
import type { Metadata } from "next";

interface StudioPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: StudioPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const company = await getCompanyDetails(Number(id));
    return {
      title: `${company.name} • Productions • Track`,
      description: company.description || `Productions et films réalisés par ${company.name}`,
    };
  } catch {
    return {
      title: "Studio • Track",
    };
  }
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { id } = await params;
  const companyId = Number(id);

  if (isNaN(companyId)) {
    notFound();
  }

  try {
    const [company, moviesRes, showsRes] = await Promise.all([
      getCompanyDetails(companyId),
      discoverByCompany(companyId, "movie").catch(() => ({ results: [] })),
      discoverByCompany(companyId, "tv").catch(() => ({ results: [] })),
    ]);

    return (
      <StudioDetailClient
        company={company}
        movies={moviesRes.results || []}
        shows={showsRes.results || []}
      />
    );
  } catch (error) {
    console.error("Error loading studio:", error);
    notFound();
  }
}
