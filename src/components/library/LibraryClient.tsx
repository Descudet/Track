"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  Heart,
  Film,
  Sparkles,
  Plus,
  Search,
  Filter,
  Dices,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PosterCard } from "@/components/ui/PosterCard";
import { BottomNavBar } from "@/components/ui/BottomNavBar";
import { RatingSheet } from "@/components/ui/RatingSheet";
import { EveningPickerModal } from "@/components/picker/EveningPickerModal";
import { triggerHaptic } from "@/lib/utils/haptics";
import {
  saveUserMediaAction,
  removeUserRatingAction,
  getUserLibraryAction,
} from "@/lib/db/actions";
import type { WatchStatus } from "@/types/cinema";

export interface LibraryItem {
  id: number;
  title: string;
  posterPath: string | null;
  year: string;
  mediaType: "movie" | "tv";
  status: WatchStatus;
  userRating?: number;
  isFavorite: boolean;
  review?: string;
  rewatchCount?: number;
}

interface LibraryClientProps {
  initialLibrary: LibraryItem[];
}

export function LibraryClient({ initialLibrary }: LibraryClientProps) {
  const router = useRouter();
  const [library, setLibrary] = useState<LibraryItem[]>(initialLibrary);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "watchlist" | "watching" | "favorites"
  >("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "movie" | "tv">("all");

  // Keep library state in sync with server props
  React.useEffect(() => {
    setLibrary(initialLibrary);
  }, [initialLibrary]);

  // Always refresh latest state when returning to the screen/tab
  React.useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const fresh = await getUserLibraryAction();
        if (isMounted) setLibrary(fresh);
      } catch (err) {
        console.error("Failed to load fresh library:", err);
      }
    };

    fetchLatest();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchLatest();
      }
    };

    window.addEventListener("focus", fetchLatest);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", fetchLatest);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Rating sheet state
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  // Evening picker roulette state
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const filteredItems = library.filter((item) => {
    // Media type filter
    if (mediaTypeFilter !== "all" && item.mediaType !== mediaTypeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === "completed") return item.status === "completed";
    if (statusFilter === "watchlist") return item.status === "watchlist";
    if (statusFilter === "watching") return item.status === "watching";
    if (statusFilter === "favorites") return item.isFavorite;

    return true;
  });

  const handleOpenRating = (item: LibraryItem) => {
    setSelectedItem(item);
    setIsRatingOpen(true);
  };

  const handleSaveRating = (data: {
    rating: number;
    review: string;
    isFavorite: boolean;
    rewatchCount: number;
  }) => {
    if (!selectedItem) return;

    // Optimistic update
    setLibrary((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id && i.mediaType === selectedItem.mediaType
          ? {
              ...i,
              status: "completed",
              userRating: data.rating,
              review: data.review,
              isFavorite: data.isFavorite,
              rewatchCount: data.rewatchCount,
            }
          : i
      )
    );

    // Save to database
    saveUserMediaAction(
      {
        tmdbId: selectedItem.id,
        mediaType: selectedItem.mediaType,
        title: selectedItem.title,
        posterPath: selectedItem.posterPath,
        releaseDate: selectedItem.year,
      },
      {
        rating: data.rating > 0 ? data.rating : undefined,
        review: data.review,
        isFavorite: data.isFavorite,
        rewatchCount: data.rewatchCount,
        status: "completed",
      }
    );
  };

  const handleDeleteRating = () => {
    if (!selectedItem) return;

    // Optimistic update: clear rating and prune if no longer tracked
    setLibrary((prev) =>
      prev
        .map((i) =>
          i.id === selectedItem.id && i.mediaType === selectedItem.mediaType
            ? {
                ...i,
                userRating: undefined,
              }
            : i
        )
        .filter(
          (i) =>
            Boolean(i.status) ||
            Boolean(i.userRating) ||
            i.isFavorite
        )
    );

    // Remove from database
    removeUserRatingAction({
      tmdbId: selectedItem.id,
      mediaType: selectedItem.mediaType,
      title: selectedItem.title,
      posterPath: selectedItem.posterPath,
      releaseDate: selectedItem.year,
    });
  };

  return (
    <div className="relative min-h-screen bg-[#050507] text-white pb-28">
      {/* iOS Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#050507]/85 px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 backdrop-blur-2xl border-b border-white/[0.06]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
            Ma Collection
          </span>
          <h1 className="text-xl font-black tracking-tight text-white">
            Bibliothèque ({library.length})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("medium");
              setIsPickerOpen(true);
            }}
            title="Sélecteur du Soir"
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#E50914]/15 px-3 text-xs font-bold text-[#E50914] border border-[#E50914]/30 hover:bg-[#E50914]/25 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Dices className="h-4 w-4 stroke-[2.5]" />
            <span>Ce soir ?</span>
          </button>

          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white hover:bg-white/[0.14] transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 pt-4">
        {/* Status Filter Segmented Control */}
        <div className="mb-3">
          <SegmentedControl
            options={[
              { value: "all", label: "Tout", count: library.length },
              {
                value: "completed",
                label: "Vus",
                count: library.filter((i) => i.status === "completed").length,
              },
              {
                value: "watchlist",
                label: "À voir",
                count: library.filter((i) => i.status === "watchlist").length,
              },
              {
                value: "watching",
                label: "En cours",
                count: library.filter((i) => i.status === "watching").length,
              },
              {
                value: "favorites",
                label: "Favoris",
                count: library.filter((i) => i.isFavorite).length,
              },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as typeof statusFilter)}
            size="sm"
          />
        </div>

        {/* Media Type Sub-Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setMediaTypeFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              mediaTypeFilter === "all"
                ? "bg-white text-black border-white"
                : "bg-white/[0.04] text-[#8e8e93] border-white/[0.08] hover:text-white"
            }`}
          >
            Tous les formats
          </button>
          <button
            type="button"
            onClick={() => setMediaTypeFilter("movie")}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              mediaTypeFilter === "movie"
                ? "bg-[#E50914] text-white border-[#E50914] shadow-sm shadow-[#E50914]/30"
                : "bg-white/[0.04] text-[#8e8e93] border-white/[0.08] hover:text-white"
            }`}
          >
            Films ({library.filter((i) => i.mediaType === "movie").length})
          </button>
          <button
            type="button"
            onClick={() => setMediaTypeFilter("tv")}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              mediaTypeFilter === "tv"
                ? "bg-[#0a84ff] text-white border-[#0a84ff]"
                : "bg-white/[0.04] text-[#8e8e93] border-white/[0.08] hover:text-white"
            }`}
          >
            Séries ({library.filter((i) => i.mediaType === "tv").length})
          </button>
        </div>

        {/* Poster Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
            {filteredItems.map((item) => (
              <PosterCard
                key={`${item.mediaType}-${item.id}`}
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                year={item.year}
                userRating={item.userRating}
                status={item.status}
                isFavorite={item.isFavorite}
                href={item.mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`}
                onClick={() => triggerHaptic("selection")}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] mb-4 text-[#8e8e93]">
              <Bookmark className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-white">
              Aucun titre dans cette catégorie
            </h3>
            <p className="mt-1 max-w-xs text-xs text-[#8e8e93]">
              Ajoutez des œuvres depuis l'onglet Découvrir ou via la Recherche.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E50914] to-[#B81D24] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E50914]/25 active:scale-95 transition-transform"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Explorer le catalogue
            </Link>
          </div>
        )}
      </main>

      {/* Rating Sheet */}
      {selectedItem && (
        <RatingSheet
          open={isRatingOpen}
          onOpenChange={setIsRatingOpen}
          title={selectedItem.title}
          posterPath={selectedItem.posterPath}
          year={selectedItem.year}
          initialRating={selectedItem.userRating ?? 4.0}
          initialReview={selectedItem.review ?? ""}
          initialIsFavorite={selectedItem.isFavorite}
          initialRewatchCount={selectedItem.rewatchCount ?? 0}
          onDeleteRating={handleDeleteRating}
          onSave={handleSaveRating}
        />
      )}

      {/* Evening Picker Modal (Roulette du Soir) */}
      <EveningPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        watchlistItems={library}
      />

      {/* Floating Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}
