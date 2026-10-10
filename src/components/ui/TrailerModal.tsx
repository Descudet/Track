"use client";

import React from "react";
import { X } from "lucide-react";
import type { TMDBVideo } from "@/types/tmdb";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videos?: TMDBVideo[];
}

export function TrailerModal({
  isOpen,
  onClose,
  title,
  videos = [],
}: TrailerModalProps) {
  if (!isOpen) return null;

  // Find official trailer or first trailer on YouTube
  const trailer =
    videos.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
    ) ||
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v) => v.site === "YouTube");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#101015] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="min-w-0 pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f5c518]">
              Bande-annonce officielle
            </span>
            <h3 className="truncate text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          {trailer ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&modestbranding=1&rel=0`}
              title={`${title} - Bande Annonce`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-[#8e8e93]">
              Aucune bande-annonce disponible pour ce titre.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
