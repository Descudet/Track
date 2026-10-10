"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { triggerHaptic } from "@/lib/utils/haptics";

export function PWAHandler() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Clean up any registered Service Worker and stale browser caches to ensure 100% fresh live assets
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        for (const reg of registrations) {
          await reg.unregister();
        }
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((name) => caches.delete(name)));
        }
        if (hadController && !sessionStorage.getItem("sw_cleared")) {
          sessionStorage.setItem("sw_cleared", "true");
          window.location.reload();
        }
      });
    }

    // 2. Connectivity Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      triggerHaptic("success");
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
      triggerHaptic("warning");
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  return (
    <>
      {/* Offline Dynamic Island Pill */}
      {isOffline && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2.5 rounded-full bg-[#18181f]/90 px-4 py-2 text-white border border-white/15 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff9f0a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff9f0a]" />
            </span>
            <WifiOff className="h-3.5 w-3.5 text-[#ff9f0a]" />
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>Mode hors-ligne</span>
              <span className="text-white/30">•</span>
              <span className="text-[11px] font-normal text-[#8e8e93]">Données en cache</span>
            </div>
          </div>
        </div>
      )}

      {/* Reconnected Dynamic Island Pill */}
      {!isOffline && showReconnected && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 rounded-full bg-[#18181f]/90 px-4 py-2 text-white border border-[#30d158]/30 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
            <span className="inline-flex rounded-full h-2 w-2 bg-[#30d158]" />
            <Wifi className="h-3.5 w-3.5 text-[#30d158]" />
            <span className="text-xs font-semibold text-white">Connexion rétablie</span>
          </div>
        </div>
      )}
    </>
  );
}
