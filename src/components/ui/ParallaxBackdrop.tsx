"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface ParallaxBackdropProps {
  src: string | null;
  alt: string;
  heightClass?: string;
  priority?: boolean;
}

export function ParallaxBackdrop({
  src,
  alt,
  heightClass = "h-[290px] sm:h-[400px]",
  priority = true,
}: ParallaxBackdropProps) {
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let rafId: number;

    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY > 0) {
          // Scrolling down: parallax translate at 42% speed and smooth fade
          setOffsetY(scrollY * 0.42);
          setScale(1);
          setOpacity(Math.max(0.2, 1 - scrollY / 360));
        } else {
          // Pulling down (iOS rubber-band effect): zoom in smoothly
          const overscroll = Math.abs(scrollY);
          setOffsetY(0);
          setScale(1 + overscroll * 0.0025);
          setOpacity(1);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#0c0c10] ${heightClass}`}
    >
      {/* Parallax Moving Layer */}
      <div
        className="absolute inset-0 h-full w-full will-change-transform"
        style={{
          transform: `translate3d(0, ${offsetY}px, 0) scale(${scale})`,
          opacity,
          transformOrigin: "center top",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover object-top opacity-100"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1c1a2e] to-[#050507]" />
        )}
      </div>

      {/* Top Ambient Vignette (softened for brighter image) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Bottom OLED Smooth Black Fade (reduced darkness veil) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 via-30% to-transparent pointer-events-none" />
    </div>
  );
}
