import { NextRequest, NextResponse } from "next/server";
import { getSeasonDetails } from "@/lib/tmdb/client";

interface RouteProps {
  params: Promise<{ id: string; seasonNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id, seasonNumber } = await params;
    const tvId = Number(id);
    const sNum = Number(seasonNumber);

    if (isNaN(tvId) || isNaN(sNum)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const data = await getSeasonDetails(tvId, sNum);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Season details API error:", error);
    return NextResponse.json(
      { error: "Échec de récupération de la saison" },
      { status: 500 }
    );
  }
}
