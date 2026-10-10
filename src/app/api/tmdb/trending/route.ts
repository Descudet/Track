import { NextRequest, NextResponse } from "next/server";
import { getTrending } from "@/lib/tmdb/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mediaType = (searchParams.get("type") || "all") as "all" | "movie" | "tv";
    const timeWindow = (searchParams.get("window") || "week") as "day" | "week";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const data = await getTrending(mediaType, timeWindow, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Trending API route error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des tendances" },
      { status: 500 }
    );
  }
}
