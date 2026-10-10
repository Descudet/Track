"use client";

import React from "react";
import Image from "next/image";
import { X, Star, Heart, Popcorn, Share2, Check } from "lucide-react";
import { triggerHaptic } from "@/lib/utils/haptics";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  posterPath: string | null;
  year?: string;
  rating?: number;
  review?: string;
}

export function ShareCardModal({
  isOpen,
  onClose,
  title,
  posterPath,
  year,
  rating = 4.5,
  review = "Une expérience cinématographique inoubliable.",
}: ShareCardModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const posterUrl = posterPath
    ? posterPath.startsWith("http")
      ? posterPath
      : `https://image.tmdb.org/t/p/w500${posterPath}`
    : null;

  const handleCopy = () => {
    triggerHaptic("success");
    navigator.clipboard?.writeText(
      `J'ai noté ${title} ★ ${rating}/5 sur Track !\n« ${review || "Recommandé !"} »`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-[#101015] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.9)] p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E50914]">
            Carte de Partage Cinéphile
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The Apple-style Share Card visual */}
        <div
          id="shareable-card"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1926] via-[#121217] to-[#08080a] p-5 border border-white/[0.12] shadow-2xl flex flex-col gap-4 text-white"
        >
          {/* Subtle Top Ambient Flare */}
          <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[#E50914]/20 blur-2xl pointer-events-none" />

          {/* App Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#E50914] to-[#B81D24]">
                <Popcorn className="h-3.5 w-3.5 text-white stroke-[2.5]" />
              </div>
              <span className="text-xs font-black tracking-tight text-white">
                Track
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#8e8e93]">
              Journal Personnel
            </span>
          </div>

          {/* Card Body: Poster & Title */}
          <div className="flex gap-4 items-center">
            <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl bg-black/50 border border-white/10 shadow-lg">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-white/10" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-base leading-tight text-white line-clamp-2">
                {title}
              </h4>
              {year && (
                <span className="text-xs text-[#8e8e93] font-medium block mt-0.5">
                  {year}
                </span>
              )}

              {/* Star Rating Badge */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 border border-[#f5c518]/40 backdrop-blur-md">
                <Star className="h-3.5 w-3.5 fill-[#f5c518] text-[#f5c518]" />
                <span className="text-xs font-bold text-[#f5c518]">
                  {rating.toFixed(1)} / 5
                </span>
              </div>
            </div>
          </div>

          {/* Review Quote if present */}
          {review && (
            <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/[0.06]">
              <p className="text-xs italic text-white/90 line-clamp-3 leading-relaxed">
                « {review} »
              </p>
            </div>
          )}
        </div>

        {/* Copy / Share Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E50914] to-[#B81D24] py-3 text-xs font-bold text-white shadow-md shadow-[#E50914]/25 active:scale-98 transition-transform"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 stroke-[2.5]" />
              Copié dans le presse-papier !
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 stroke-[2.5]" />
              Copier le texte de partage
            </>
          )}
        </button>
      </div>
    </div>
  );
}
