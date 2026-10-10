import { NextRequest, NextResponse } from "next/server";
import { getGenres } from "@/lib/tmdb/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get("type") || "movie") as "movie" | "tv";

    const data = await getGenres(type);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Genres API route error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des genres" },
      { status: 500 }
    );
  }
}
