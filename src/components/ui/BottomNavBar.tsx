"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Search, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";

export interface NavTabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const NAV_TABS: NavTabItem[] = [
  {
    id: "discover",
    label: "Découvrir",
    href: "/",
    icon: Compass,
  },
  {
    id: "search",
    label: "Recherche",
    href: "/search",
    icon: Search,
  },
  {
    id: "library",
    label: "Bibliothèque",
    href: "/library",
    icon: Bookmark,
  },
  {
    id: "profile",
    label: "Profil",
    href: "/profile",
    icon: User,
  },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/library")) return "library";
    if (pathname.startsWith("/profile")) return "profile";
    return "discover";
  };

  const activeTab = getActiveTab();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-2"
    >
      <div className="mx-auto max-w-md">
        <div className="flex h-16 items-center justify-around rounded-full bg-[#101015]/85 px-3 backdrop-blur-2xl border border-white/[0.1] shadow-[0_12px_36px_rgba(0,0,0,0.7)]">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => {
                  triggerHaptic("selection");
                  router.refresh();
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1 px-4 transition-all duration-200 select-none active:scale-90 touch-manipulation cursor-pointer",
                  isActive ? "text-[#E50914]" : "text-[#8e8e93] hover:text-white/80"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive && "scale-110 drop-shadow-[0_0_10px_rgba(229,9,20,0.5)]"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span
                  className={cn(
                    "mt-1 text-[10px] tracking-tight font-medium transition-colors",
                    isActive ? "text-white font-semibold" : "text-[#8e8e93]"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
