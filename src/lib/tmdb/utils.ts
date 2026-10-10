import type { TMDBImageLogo } from "@/types/tmdb";

/**
 * Sélectionne le meilleur logo parmi la liste TMDB (priorité au français, puis anglais, puis meilleur score)
 */
export function getBestLogo(logos?: TMDBImageLogo[]): string | null {
  if (!logos || logos.length === 0) return null;

  // 1. Logo en français ('fr') avec le meilleur vote
  const frLogos = logos.filter((l) => l.iso_639_1 === "fr");
  if (frLogos.length > 0) {
    frLogos.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    return frLogos[0].file_path;
  }

  // 2. Logo en anglais ('en') avec le meilleur vote
  const enLogos = logos.filter((l) => l.iso_639_1 === "en");
  if (enLogos.length > 0) {
    enLogos.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    return enLogos[0].file_path;
  }

  // 3. Fallback sur le logo ayant le meilleur vote général
  const sorted = [...logos].sort(
    (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0)
  );
  return sorted[0]?.file_path ?? null;
}
