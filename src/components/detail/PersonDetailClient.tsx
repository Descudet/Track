"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, MapPin, Film, Tv, Award } from "lucide-react";
import { PosterCard } from "@/components/ui/PosterCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";
import type { TMDBPersonRaw } from "@/types/tmdb";

interface PersonDetailClientProps {
  person: TMDBPersonRaw;
}

export function PersonDetailClient({ person }: PersonDetailClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "directed" | "acted">("all");
  const [showFullBio, setShowFullBio] = useState(false);

  const profileUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
    : null;

  // Cast credits (acted)
  const actedWorks = (person.combined_credits?.cast || []).filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );

  // Crew credits (directed)
  const directedWorks = (person.combined_credits?.crew || [])
    .filter((item) => item.job === "Director")
    .filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );

  // Top popular works
  const popularWorks = [...actedWorks, ...directedWorks]
    .filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    )
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 10);

  const filteredCredits =
    filter === "directed"
      ? directedWorks
      : filter === "acted"
      ? actedWorks
      : [...actedWorks, ...directedWorks].filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );

  const birthYear = person.birthday ? person.birthday.split("-")[0] : null;

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

      {/* Header Profile Area */}
      <header className="relative bg-gradient-to-b from-[#181822] via-[#0d0d12] to-[#050507] px-5 pt-[calc(env(safe-area-inset-top,0px)+4rem)] pb-8 border-b border-white/[0.06]">
        <div className="flex gap-4 items-center">
          {/* Portrait Image */}
          <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-2xl bg-black/50 border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            {profileUrl ? (
              <Image
                src={profileUrl}
                alt={person.name}
                fill
                priority
                className="object-cover"
                sizes="150px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                Sans photo
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
              {person.known_for_department === "Directing"
                ? "Réalisateur"
                : person.known_for_department === "Acting"
                ? "Acteur"
                : person.known_for_department}
            </span>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white leading-tight">
              {person.name}
            </h1>

            <div className="mt-2 flex flex-col gap-1 text-xs text-[#8e8e93]">
              {person.birthday && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Né(e) en {birthYear}</span>
                </div>
              )}
              {person.place_of_birth && (
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{person.place_of_birth}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biography */}
        {person.biography && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e93] mb-2">
              Biographie
            </h3>
            <p
              className={cn(
                "text-xs leading-relaxed text-white/80 transition-all",
                !showFullBio && "line-clamp-4"
              )}
            >
              {person.biography}
            </p>
            {person.biography.length > 250 && (
              <button
                type="button"
                onClick={() => setShowFullBio(!showFullBio)}
                className="mt-2 text-xs font-semibold text-[#E50914] hover:underline"
              >
                {showFullBio ? "Réduire" : "Lire la suite..."}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-8 px-5 pt-6">
        {/* Row 1: Œuvres Populaires */}
        {popularWorks.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#E50914]" />
              <h2 className="text-base font-bold text-white">
                Œuvres les plus marquantes
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {popularWorks.map((work) => {
                const title = work.title || (work as any).name || "Sans titre";
                const date = work.release_date || (work as any).first_air_date;
                const year = date ? date.split("-")[0] : undefined;
                const path = work.media_type === "tv" ? `/tv/${work.id}` : `/movie/${work.id}`;

                return (
                  <div key={`pop-${work.id}`} className="w-32 shrink-0">
                    <PosterCard
                      id={work.id}
                      title={title}
                      posterPath={work.poster_path}
                      year={year}
                      rating={work.vote_average}
                      href={path}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Row 2: Filmographie Complète */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Filmographie complète ({filteredCredits.length})
            </h2>
          </div>

          {/* Filter segment if person has both directed & acted */}
          {directedWorks.length > 0 && actedWorks.length > 0 && (
            <SegmentedControl
              options={[
                { value: "all", label: "Tout", count: filteredCredits.length },
                { value: "directed", label: "Réalisés", count: directedWorks.length },
                { value: "acted", label: "Interprétés", count: actedWorks.length },
              ]}
              value={filter}
              onChange={(val) => setFilter(val as typeof filter)}
            />
          )}

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {filteredCredits.slice(0, 24).map((work) => {
              const title = work.title || (work as any).name || "Sans titre";
              const date = work.release_date || (work as any).first_air_date;
              const year = date ? date.split("-")[0] : undefined;
              const path = work.media_type === "tv" ? `/tv/${work.id}` : `/movie/${work.id}`;

              return (
                <PosterCard
                  key={`filmo-${work.id}`}
                  id={work.id}
                  title={title}
                  posterPath={work.poster_path}
                  year={year}
                  rating={work.vote_average}
                  href={path}
                />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
