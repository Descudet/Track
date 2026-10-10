"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Dices,
  X,
  Clock,
  Film,
  Tv,
  Star,
  Check,
  RotateCcw,
  ArrowRight,
  Flame,
} from "lucide-react";
import { triggerHaptic } from "@/lib/utils/haptics";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/components/library/LibraryClient";
import type { TMDBSearchResultItem } from "@/types/tmdb";

interface EveningPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistItems?: LibraryItem[];
}

const MOODS = [
  { id: "all", label: "Toute ambiance", icon: Sparkles },
  { id: "laugh", label: "Rire & Détente", genre: "Comédie", icon: Sparkles },
  { id: "thrill", label: "Frisson & Mystère", genre: "Thriller", icon: Flame },
  { id: "escape", label: "Évasion & SF", genre: "Science-Fiction", icon: Sparkles },
  { id: "drama", label: "Émotion intense", genre: "Drame", icon: Sparkles },
  { id: "action", label: "Adrénaline", genre: "Action", icon: Flame },
];

export function EveningPickerModal({
  isOpen,
  onClose,
  watchlistItems = [],
}: EveningPickerModalProps) {
  const router = useRouter();
  const [maxDuration, setMaxDuration] = useState<number>(0); // 0 = any, 100 = < 1h40, 125 = < 2h05
  const [format, setFormat] = useState<"all" | "movie" | "tv">("movie");
  const [mood, setMood] = useState<string>("all");

  const [isShuffling, setIsShuffling] = useState(false);
  const [pickedItem, setPickedItem] = useState<{
    id: number;
    title: string;
    posterPath: string | null;
    backdropPath?: string | null;
    year?: string;
    mediaType: "movie" | "tv";
    rating?: number;
    overview?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Filter local watchlist
  const filteredWatchlist = watchlistItems.filter((item) => {
    if (item.status !== "watchlist") return false;
    if (format !== "all" && item.mediaType !== format) return false;
    return true;
  });

  const handlePickRandom = async () => {
    triggerHaptic("medium");
    setIsShuffling(true);

    let candidates: Array<{
      id: number;
      title: string;
      posterPath: string | null;
      backdropPath?: string | null;
      year?: string;
      mediaType: "movie" | "tv";
      rating?: number;
      overview?: string;
    }> = [];

    // If watchlist has matching candidates, use them
    if (filteredWatchlist.length > 0) {
      candidates = filteredWatchlist.map((i) => ({
        id: i.id,
        title: i.title,
        posterPath: i.posterPath,
        year: i.year,
        mediaType: i.mediaType,
        rating: 8.0,
      }));
    } else {
      // Fallback: fetch trending pool from API
      try {
        const res = await fetch(`/api/tmdb/trending?type=${format === "all" ? "movie" : format}&time=week`);
        const data = await res.json();
        const results = (data.results || []) as TMDBSearchResultItem[];
        candidates = results
          .filter((i) => Boolean(i.poster_path))
          .map((i) => ({
            id: i.id,
            title: i.title || i.name || "Sans titre",
            posterPath: i.poster_path || null,
            backdropPath: i.backdrop_path || null,
            year: (i.release_date || i.first_air_date || "").split("-")[0],
            mediaType: (i.media_type as "movie" | "tv") || "movie",
            rating: i.vote_average,
            overview: i.overview,
          }));
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      }
    }

    if (candidates.length === 0) {
      setIsShuffling(false);
      return;
    }

    // Shuffle cycle animation (simulate excitement)
    let cycle = 0;
    const interval = setInterval(() => {
      const tempWinner = candidates[Math.floor(Math.random() * candidates.length)];
      setPickedItem(tempWinner);
      cycle++;
      if (cycle > 8) {
        clearInterval(interval);
        const finalWinner = candidates[Math.floor(Math.random() * candidates.length)];
        setPickedItem(finalWinner);
        setIsShuffling(false);
        triggerHaptic("success");
      }
    }, 120);
  };

  const handleGoToDetails = () => {
    if (!pickedItem) return;
    onClose();
    router.push(pickedItem.mediaType === "tv" ? `/tv/${pickedItem.id}` : `/movie/${pickedItem.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl animate-fadeIn p-0 sm:p-4">
      <div className="relative w-full max-w-lg rounded-t-[36px] sm:rounded-3xl bg-[#121217] border border-white/[0.12] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.9)] max-h-[92dvh] overflow-y-auto">
        {/* iOS Grab Handle */}
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B81D24] text-white shadow-md shadow-[#E50914]/30">
              <Dices className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Sélecteur du Soir
              </h2>
              <p className="text-xs text-[#8e8e93]">
                {filteredWatchlist.length > 0
                  ? `Parmi ${filteredWatchlist.length} titre(s) de votre liste`
                  : "Suggestions tendances du moment"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selected Result Display or Picker Controls */}
        {pickedItem && !isShuffling ? (
          <div className="mt-6 flex flex-col items-center animate-fadeIn">
            {/* Winner Badge */}
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#E50914]/15 px-3 py-1 text-xs font-bold text-[#E50914] border border-[#E50914]/30">
              <Sparkles className="h-3.5 w-3.5" />
              Sélection de votre soirée
            </span>

            {/* Poster Card */}
            <div className="relative aspect-[2/3] w-44 overflow-hidden rounded-2xl bg-black/50 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.8)]">
              {pickedItem.posterPath ? (
                <Image
                  src={
                    pickedItem.posterPath.startsWith("http")
                      ? pickedItem.posterPath
                      : `https://image.tmdb.org/t/p/w500${pickedItem.posterPath}`
                  }
                  alt={pickedItem.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-white/40">
                  {pickedItem.title}
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <h3 className="mt-4 text-center text-xl font-black text-white">
              {pickedItem.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#8e8e93]">
              {pickedItem.year && <span>{pickedItem.year}</span>}
              <span className="text-white/20">•</span>
              <span className="capitalize">{pickedItem.mediaType === "tv" ? "Série" : "Film"}</span>
              {pickedItem.rating && (
                <>
                  <span className="text-white/20">•</span>
                  <div className="inline-flex items-center gap-1 text-[#f5c518]">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{pickedItem.rating.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>

            {pickedItem.overview && (
              <p className="mt-3 line-clamp-3 text-center text-xs text-[#8e8e93] leading-relaxed max-w-sm">
                {pickedItem.overview}
              </p>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGoToDetails}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E50914] to-[#B81D24] text-sm font-bold text-white shadow-lg shadow-[#E50914]/25 hover:brightness-105 active:scale-95 transition-all"
              >
                <span>C'est parti ! Voir la fiche</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handlePickRandom}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.08] text-xs font-semibold text-white/90 border border-white/10 hover:bg-white/[0.12] active:scale-95 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Tirer une autre œuvre au sort</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            {/* Control 1: Format Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                1. Format souhaité
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "movie", label: "Films", icon: Film },
                  { id: "tv", label: "Séries", icon: Tv },
                  { id: "all", label: "Tous", icon: Sparkles },
                ].map((fmt) => {
                  const Icon = fmt.icon;
                  const active = format === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormat(fmt.id as typeof format)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all border active:scale-95",
                        active
                          ? "bg-[#E50914] text-white border-[#E50914] shadow-md shadow-[#E50914]/30"
                          : "bg-white/[0.06] text-[#8e8e93] border-white/[0.06] hover:text-white"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{fmt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control 2: Maximum Runtime */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                2. Temps disponible
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: "Toute durée" },
                  { value: 100, label: "< 1h40 (Court)" },
                  { value: 130, label: "< 2h10 (Standard)" },
                ].map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setMaxDuration(d.value)}
                    className={cn(
                      "flex items-center justify-center rounded-2xl py-2.5 text-xs font-bold transition-all border active:scale-95",
                      maxDuration === d.value
                        ? "bg-white text-black border-white shadow-md"
                        : "bg-white/[0.06] text-[#8e8e93] border-white/[0.06] hover:text-white"
                    )}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Mood / Atmosphere */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                3. Humeur du soir
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border active:scale-95",
                      mood === m.id
                        ? "bg-[#E50914] text-white border-[#E50914] font-semibold shadow-md shadow-[#E50914]/25"
                        : "bg-white/[0.06] text-[#8e8e93] border-white/[0.06] hover:text-white"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Launch Button */}
            <div className="mt-4 pt-2">
              <button
                type="button"
                disabled={isShuffling}
                onClick={handlePickRandom}
                className="relative flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#E50914] via-[#B81D24] to-[#E50914] text-base font-black text-white shadow-[0_8px_30px_rgba(229,9,20,0.4)] hover:brightness-105 active:scale-95 transition-all overflow-hidden"
              >
                {isShuffling ? (
                  <div className="flex items-center gap-2">
                    <Dices className="h-5 w-5 animate-spin" />
                    <span>Mélange des options...</span>
                  </div>
                ) : (
                  <>
                    <Dices className="h-5 w-5 stroke-[2.5]" />
                    <span>Lancer la roulette !</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
