"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, Bookmark, RotateCw, Popcorn } from "lucide-react";
import { BottomNavBar } from "@/components/ui/BottomNavBar";
import { triggerHaptic } from "@/lib/utils/haptics";

export default function OfflinePage() {
  const handleReload = () => {
    triggerHaptic("medium");
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050507] text-white flex flex-col justify-between pb-28">
      {/* Top Header */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center justify-between border-b border-white/[0.06] bg-[#050507]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-[0_2px_10px_rgba(229,9,20,0.3)]">
            <Popcorn className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">Track</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9f0a]/15 px-3 py-1 border border-[#ff9f0a]/30">
          <span className="h-2 w-2 rounded-full bg-[#ff9f0a] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#ff9f0a]">Hors-ligne</span>
        </div>
      </header>

      {/* Main Offline Card */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-0 rounded-full bg-[#ff9f0a]/10 blur-xl pointer-events-none" />
          <WifiOff className="h-10 w-10 text-[#ff9f0a] stroke-[1.75]" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Mode Hors-Ligne
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#8e8e93]">
          Vous n&apos;êtes actuellement pas connecté à Internet. Vos films, séries et données enregistrés dans votre bibliothèque restent consultables en cache.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col w-full max-w-xs gap-3">
          <Link
            href="/library"
            onClick={() => triggerHaptic("selection")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#E50914] py-3.5 px-5 text-sm font-bold text-white shadow-lg shadow-[#E50914]/25 active:scale-95 transition-transform"
          >
            <Bookmark className="h-4 w-4 stroke-[2.5]" />
            <span>Accéder à ma bibliothèque</span>
          </Link>

          <button
            type="button"
            onClick={handleReload}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.08] py-3.5 px-5 text-sm font-semibold text-white border border-white/10 hover:bg-white/[0.12] active:scale-95 transition-all"
          >
            <RotateCw className="h-4 w-4" />
            <span>Réessayer la connexion</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}
