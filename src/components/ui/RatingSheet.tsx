"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "vaul";
import Image from "next/image";
import { Heart, Repeat, Calendar, Check, X, Trash2 } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { cn } from "@/lib/utils";

interface RatingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  posterPath: string | null;
  year?: string | number;
  initialRating?: number;
  initialReview?: string;
  initialIsFavorite?: boolean;
  initialRewatchCount?: number;
  onSave: (data: {
    rating: number;
    review: string;
    isFavorite: boolean;
    rewatchCount: number;
  }) => void;
  onDeleteRating?: () => void;
}

export function RatingSheet({
  open,
  onOpenChange,
  title,
  posterPath,
  year,
  initialRating = 4.0,
  initialReview = "",
  initialIsFavorite = false,
  initialRewatchCount = 0,
  onSave,
  onDeleteRating,
}: RatingSheetProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [review, setReview] = useState<string>(initialReview);
  const [isFavorite, setIsFavorite] = useState<boolean>(initialIsFavorite);
  const [rewatchCount, setRewatchCount] = useState<number>(initialRewatchCount);

  useEffect(() => {
    if (open) {
      setRating(initialRating || 0);
      setReview(initialReview || "");
      setIsFavorite(initialIsFavorite || false);
      setRewatchCount(initialRewatchCount || 0);
    }
  }, [open, initialRating, initialReview, initialIsFavorite, initialRewatchCount]);

  const posterUrl = posterPath
    ? posterPath.startsWith("http")
      ? posterPath
      : `https://image.tmdb.org/t/p/w342${posterPath}`
    : null;

  const handleSave = () => {
    onSave({
      rating,
      review,
      isFavorite,
      rewatchCount,
    });
    onOpenChange(false);
  };

  const handleRemoveRating = () => {
    setRating(0);
    if (onDeleteRating) {
      onDeleteRating();
    } else {
      onSave({
        rating: 0,
        review,
        isFavorite,
        rewatchCount,
      });
    }
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        {/* Backdrop overlay with blur */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity" />

        {/* Bottom Drawer Content */}
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88vh] flex-col rounded-t-[32px] bg-[#121217] border-t border-white/[0.12] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] focus:outline-none">
          {/* iOS Grab Handle */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20 shrink-0" />

          <div className="overflow-y-auto px-6 pt-4 pb-4 overscroll-contain">
            {/* Header with Title and Thumbnail */}
            <div className="flex items-center gap-4 border-b border-white/[0.08] pb-4">
              <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-xl bg-black/40 border border-white/10 shadow-md">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                    No Poster
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#f5c518]">
                  Journal Personnel
                </span>
                <h3 className="truncate text-base font-bold text-white">
                  {title}
                </h3>
                {year && (
                  <p className="text-xs text-[#8e8e93]">Sorti en {year}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Rating Section (0.5 to 5.0) */}
            <div className="my-6 flex flex-col items-center justify-center">
              <span className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">
                Votre note
              </span>
              <RatingStars
                value={rating}
                onChange={setRating}
                size="xl"
                showLabel={true}
              />

              {rating > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveRating}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#ff3b30]/10 px-3.5 py-1.5 text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/20 border border-[#ff3b30]/30 transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Enlever ma note</span>
                </button>
              )}
            </div>

            {/* Quick Action Toggles (Favorite & Rewatch) */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl p-3 border text-xs font-semibold transition-all duration-200 active:scale-95",
                  isFavorite
                    ? "bg-[#ff3b30]/15 border-[#ff3b30]/40 text-[#ff3b30]"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.07]"
                )}
              >
                <Heart
                  className={cn("h-4 w-4", isFavorite && "fill-current")}
                />
                {isFavorite ? "Dans mes favoris" : "Ajouter aux favoris"}
              </button>

              <button
                type="button"
                onClick={() => setRewatchCount((prev) => prev + 1)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl p-3 border text-xs font-semibold transition-all duration-200 active:scale-95",
                  rewatchCount > 0
                    ? "bg-[#30d158]/15 border-[#30d158]/40 text-[#30d158]"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.07]"
                )}
              >
                <Repeat className="h-4 w-4" />
                {rewatchCount > 0
                  ? `Revu (${rewatchCount}x)`
                  : "Marquer comme revu"}
              </button>
            </div>

            {/* Personal Review */}
            <div className="mb-5" data-vaul-no-drag>
              <label
                htmlFor="personal-review"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Votre critique & avis
              </label>
              <textarea
                id="personal-review"
                data-vaul-no-drag
                value={review}
                onChange={(e) => setReview(e.target.value)}
                onFocus={(e) => {
                  const target = e.currentTarget;
                  setTimeout(() => {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 250);
                }}
                placeholder="Pourquoi avez-vous aimé ou non cette œuvre ? Vos scènes préférées, ressenti..."
                rows={3}
                className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.1] p-3 text-sm text-white placeholder-white/30 focus:border-[#E50914]/50 focus:outline-none focus:ring-1 focus:ring-[#E50914]/50 resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E50914] to-[#B81D24] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.35)] transition-transform duration-150 active:scale-[0.98]"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              Enregistrer dans mon journal
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
