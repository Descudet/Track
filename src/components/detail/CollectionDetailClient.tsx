"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Film, Star } from "lucide-react";
import { PosterCard } from "@/components/ui/PosterCard";
import { ParallaxBackdrop } from "@/components/ui/ParallaxBackdrop";
import { triggerHaptic } from "@/lib/utils/haptics";
import type { TMDBCollectionRaw } from "@/types/tmdb";

interface CollectionDetailClientProps {
  collection: TMDBCollectionRaw;
}

export function CollectionDetailClient({
  collection,
}: CollectionDetailClientProps) {
  const router = useRouter();

  const backdropUrl = collection.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`
    : null;

  const posterUrl = collection.poster_path
    ? `https://image.tmdb.org/t/p/w500${collection.poster_path}`
    : null;

  // Chronological sort
  const sortedParts = [...(collection.parts || [])].sort((a, b) => {
    const dateA = a.release_date || "9999";
    const dateB = b.release_date || "9999";
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="relative min-h-screen bg-[#050507] text-white pb-28">
      {/* Top Floating iOS Back Button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              router.push("/");
            }
          }}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white active:scale-90 transition-transform shadow-lg touch-manipulation cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5] -ml-0.5" />
        </button>
      </div>

      {/* Backdrop Hero with Parallax */}
      <ParallaxBackdrop
        src={backdropUrl}
        alt={collection.name}
        heightClass="h-[270px] sm:h-[380px]"
      />

      {/* Main Info */}
      <div className="relative -mt-36 sm:-mt-44 px-5 z-10">
        <div className="flex gap-4 items-end">
          <div className="relative aspect-[2/3] w-28 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-black/50 border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={collection.name}
                fill
                className="object-cover"
                sizes="150px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                Sans affiche
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
              Saga Cinématographique
            </span>
            <h1 className="mt-1 text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {collection.name}
            </h1>
            <p className="text-xs text-[#8e8e93] mt-1">
              {sortedParts.length} film{sortedParts.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {collection.overview && (
          <div className="mt-6">
            <p className="text-sm leading-relaxed text-white/80">
              {collection.overview}
            </p>
          </div>
        )}

        {/* Chronological Movies in Saga */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Film className="h-4 w-4 text-[#E50914]" />
            <h2 className="text-base font-bold text-white">
              Ordre chronologique des films
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
            {sortedParts.map((movie) => (
              <PosterCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                posterPath={movie.poster_path}
                year={movie.release_date ? movie.release_date.split("-")[0] : undefined}
                rating={movie.vote_average}
                href={`/movie/${movie.id}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
