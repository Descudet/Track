"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Tv,
  Star,
  Clock,
  Heart,
  Award,
  Sparkles,
  Quote,
  User,
  Users,
  Download,
  Upload,
  Database,
  Check,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Smartphone,
  Wifi,
  LogOut,
  Cloud,
} from "lucide-react";
import { BottomNavBar } from "@/components/ui/BottomNavBar";
import { triggerHaptic } from "@/lib/utils/haptics";
import { logoutAction } from "@/lib/auth/actions";
import {
  getUserStatsAction,
  exportUserDataAction,
  importUserDataAction,
  importLetterboxdCsvAction,
} from "@/lib/db/actions";

interface UserStatsProps {
  stats: {
    moviesWatched: number;
    showsWatched: number;
    averageRating: number;
    hoursWatched: number;
    favoritesCount: number;
    watchlistCount?: number;
    topGenres: { name: string; percentage: number; count: number }[];
    topDirectors: { name: string; count: number; works: string }[];
    topActors?: { name: string; count: number; works: string }[];
    recentReviews: {
      id: number;
      title: string;
      year: string;
      posterPath: string | null;
      rating: number;
      date: string;
      review: string;
    }[];
  };
  currentUser?: {
    id: string;
    email: string | null;
    displayName: string;
  } | null;
}

export function ProfileClient({
  stats: initialStats,
  currentUser,
}: UserStatsProps) {
  const [stats, setStats] = React.useState(initialStats);
  const [user, setUser] = React.useState(currentUser);

  React.useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("track_user", JSON.stringify(currentUser));
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("track_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, [currentUser]);

  React.useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const fresh = await getUserStatsAction();
        if (isMounted) setStats(fresh);
      } catch (err) {
        console.error("Failed to load fresh stats:", err);
      }
    };

    fetchLatest();

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchLatest();
    };

    window.addEventListener("focus", fetchLatest);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", fetchLatest);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportUserDataAction();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `track-sauvegarde-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerHaptic("success");
      setImportStatus({
        type: "success",
        message: "Sauvegarde JSON téléchargée avec succès !",
      });
    } catch (err: any) {
      triggerHaptic("warning");
      setImportStatus({
        type: "error",
        message: err.message || "Erreur lors de l'exportation.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportStatus(null);
      const text = await file.text();

      if (file.name.endsWith(".json")) {
        const json = JSON.parse(text);
        const res = await importUserDataAction(json);
        triggerHaptic("success");
        setImportStatus({
          type: "success",
          message: `${res.count} œuvre(s) importée(s) depuis la sauvegarde Track.`,
        });
      } else if (file.name.endsWith(".csv")) {
        const res = await importLetterboxdCsvAction(text);
        triggerHaptic("success");
        setImportStatus({
          type: "success",
          message: `${res.importedCount} film(s) importé(s) depuis Letterboxd (${res.totalParsed} lignes analysées).`,
        });
      } else {
        throw new Error("Format de fichier non pris en charge. Veuillez utiliser un fichier .json ou .csv.");
      }

      // Recharger immédiatement les statistiques fraîches
      const fresh = await getUserStatsAction();
      setStats(fresh);
    } catch (err: any) {
      triggerHaptic("warning");
      setImportStatus({
        type: "error",
        message: err.message || "Erreur lors de l'importation.",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const totalWatched = stats.moviesWatched + stats.showsWatched;

  return (
    <div className="relative min-h-screen bg-[#050507] text-white pb-28">
      {/* Header Profile Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#181822] via-[#0d0d12] to-[#050507] px-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-8 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#E50914] to-[#B81D24] p-0.5 shadow-[0_0_24px_rgba(229,9,20,0.35)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d0d12] font-black text-lg text-[#E50914]">
                {user?.displayName ? (
                  user.displayName.slice(0, 2).toUpperCase()
                ) : (
                  <User className="h-8 w-8 text-[#E50914]" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {user?.displayName || "Mon Journal"}
                </h1>
                <span className="rounded-full bg-[#E50914]/15 px-2 py-0.5 text-[10px] font-semibold text-[#E50914] border border-[#E50914]/30">
                  {user ? "Synchronisé" : "Cinéphile"}
                </span>
              </div>
              <p className="text-xs text-[#8e8e93] mt-0.5">
                {user?.email ||
                  (totalWatched > 0
                    ? `${totalWatched} œuvre${totalWatched > 1 ? "s" : ""} vue${totalWatched > 1 ? "s" : ""}${stats.watchlistCount ? ` • ${stats.watchlistCount} à voir` : ""}`
                    : stats.watchlistCount
                    ? `${stats.watchlistCount} œuvre${stats.watchlistCount > 1 ? "s" : ""} dans votre liste d'attente`
                    : "0 œuvre vue • Journal cinéphile")}
              </p>
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={async () => {
                triggerHaptic("warning");
                if (typeof window !== "undefined") {
                  localStorage.removeItem("track_user");
                  document.cookie = "track_user_id=; path=/; max-age=0";
                }
                await logoutAction();
                window.location.reload();
              }}
              title="Se déconnecter"
              className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.15] active:scale-95 transition-all border border-white/10 touch-manipulation cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}
        </div>

        {/* Sync Prompt if unauthenticated */}
        {!user && (
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#E50914]/15 via-white/[0.04] to-transparent p-4 border border-[#E50914]/30 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E50914] text-white">
                <Cloud className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Synchronisation multi-appareils</h3>
                <p className="text-[11px] text-[#8e8e93]">Retrouvez votre cinémathèque sur votre iPhone, Mac et iPad.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => triggerHaptic("selection")}
                className="flex-1 text-center rounded-xl bg-[#E50914] py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-transform"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                onClick={() => triggerHaptic("selection")}
                className="flex-1 text-center rounded-xl bg-white/[0.08] py-2 text-xs font-semibold text-white border border-white/15 hover:bg-white/[0.14] active:scale-95 transition-all"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        )}

        {/* Bento Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Card 1: Films */}
          <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2 text-[#8e8e93]">
              <Film className="h-3.5 w-3.5 text-[#E50914]" />
              <span className="text-[11px] font-medium">Films vus</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {stats.moviesWatched}
            </div>
          </div>

          {/* Card 2: Séries */}
          <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2 text-[#8e8e93]">
              <Tv className="h-3.5 w-3.5 text-[#0a84ff]" />
              <span className="text-[11px] font-medium">Séries suivies</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {stats.showsWatched}
            </div>
          </div>

          {/* Card 3: Note moyenne */}
          <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2 text-[#8e8e93]">
              <Star className="h-3.5 w-3.5 fill-[#f5c518] text-[#f5c518]" />
              <span className="text-[11px] font-medium">Note moyenne</span>
            </div>
            <div className="mt-2 text-2xl font-black text-[#f5c518]">
              {stats.averageRating > 0 ? stats.averageRating : "-"}
              <span className="text-sm font-normal text-white/50"> / 5</span>
            </div>
          </div>

          {/* Card 4: Temps passé */}
          <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2 text-[#8e8e93]">
              <Clock className="h-3.5 w-3.5 text-[#30d158]" />
              <span className="text-[11px] font-medium">Temps passé</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {stats.hoursWatched}h
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex flex-col gap-8 px-5 pt-6">
        {/* Empty State when no items have been watched */}
        {totalWatched === 0 && (
          <section className="rounded-3xl bg-[#0f0f14] p-6 border border-white/[0.08] text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 text-white/60">
              <Film className="h-7 w-7 text-[#E50914]" />
            </div>
            <h3 className="text-base font-black text-white">
              Vos statistiques se construiront ici
            </h3>
            <p className="mt-2 text-xs text-[#8e8e93] leading-relaxed max-w-sm mx-auto">
              Vous n&apos;avez pas encore marqué d&apos;œuvre comme « Vu ». Dès vos premiers visionnages, Track analysera automatiquement votre temps passé, vos genres de prédilection, ainsi que vos réalisateurs et acteurs préférés.
            </p>
            {stats.watchlistCount && stats.watchlistCount > 0 ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-xs text-white/80 border border-white/[0.08]">
                <span>📋 Vous avez {stats.watchlistCount} œuvre{stats.watchlistCount > 1 ? "s" : ""} dans votre liste « À voir ».</span>
              </div>
            ) : null}
            <div className="mt-5">
              <Link
                href="/"
                onClick={() => triggerHaptic("selection")}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E50914] to-[#B81D24] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#E50914]/25 active:scale-95 transition-all"
              >
                <span>Explorer le catalogue</span>
              </Link>
            </div>
          </section>
        )}

        {/* Section 1: Genres de prédilection */}
        {totalWatched > 0 && stats.topGenres.length > 0 && (
          <section className="rounded-3xl bg-[#0f0f14] p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E50914]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Genres de prédilection
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#8e8e93]">
                Top {stats.topGenres.length}
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {stats.topGenres.map((genre) => (
                <div key={genre.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/90">{genre.name}</span>
                    <span className="text-[#8e8e93]">
                      {genre.count} titre{genre.count > 1 ? "s" : ""} ({genre.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#B81D24]"
                      style={{ width: `${genre.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Réalisateurs favoris */}
        {totalWatched > 0 && stats.topDirectors.length > 0 && (
          <section className="rounded-3xl bg-[#0f0f14] p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#E50914]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Réalisateurs favoris
                </h2>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/[0.06]">
              {stats.topDirectors.map((director) => (
                <div
                  key={director.name}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="pr-3 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {director.name}
                    </h4>
                    <p className="text-xs text-[#8e8e93] truncate">{director.works}</p>
                  </div>
                  <span className="rounded-full bg-[#E50914]/15 px-2.5 py-1 text-xs font-bold text-[#E50914] border border-[#E50914]/25 shrink-0">
                    {director.count} vu{director.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Acteurs & Actrices favoris */}
        {totalWatched > 0 && stats.topActors && stats.topActors.length > 0 && (
          <section className="rounded-3xl bg-[#0f0f14] p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#E50914]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Acteurs & Actrices favoris
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#8e8e93]">
                Top {stats.topActors.length}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-white/[0.06]">
              {stats.topActors.map((actor) => (
                <div
                  key={actor.name}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="pr-3 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {actor.name}
                    </h4>
                    <p className="text-xs text-[#8e8e93] truncate">{actor.works}</p>
                  </div>
                  <span className="rounded-full bg-[#E50914]/15 px-2.5 py-1 text-xs font-bold text-[#E50914] border border-[#E50914]/25 shrink-0">
                    {actor.count} vu{actor.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Dernières critiques personnelles */}
        {stats.recentReviews.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-[#30d158]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Dernières critiques rédigées ({stats.recentReviews.length})
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {stats.recentReviews.map((item) => (
                <Link
                  key={item.id}
                  href={`/movie/${item.id}`}
                  className="flex gap-4 rounded-3xl bg-white/[0.03] p-4 border border-white/[0.08] backdrop-blur-md hover:bg-white/[0.06] transition-colors"
                >
                  <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-xl bg-black/40 border border-white/10">
                    {item.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/10" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="truncate text-sm font-bold text-white">
                        {item.title}
                      </h4>
                      <span className="flex items-center gap-1 text-xs font-bold text-[#f5c518]">
                        <Star className="h-3 w-3 fill-current" />
                        {item.rating}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#8e8e93] block mt-0.5">
                      {item.date}
                    </span>

                    <p className="mt-2 text-xs italic text-white/80 line-clamp-2 leading-relaxed">
                      « {item.review} »
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Données, Sauvegarde & Import Letterboxd */}
        <section className="rounded-3xl bg-[#0f0f14] p-5 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-[#f5c518]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Données & Sauvegarde
            </h2>
          </div>
          <p className="text-xs text-[#8e8e93] mb-5 leading-relaxed">
            Conservez vos données sous votre contrôle. Exportez votre bibliothèque au format JSON ou importez un historique complet depuis Letterboxd (CSV).
          </p>

          {/* Status Alert if any */}
          {importStatus && (
            <div
              className={`mb-4 flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium border ${
                importStatus.type === "success"
                  ? "bg-[#30d158]/10 text-[#30d158] border-[#30d158]/25"
                  : "bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/25"
              }`}
            >
              {importStatus.type === "success" ? (
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed">{importStatus.message}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export Button */}
            <button
              type="button"
              disabled={isExporting || isImporting}
              onClick={handleExport}
              className="flex items-center justify-between rounded-2xl bg-white/[0.05] p-4 border border-white/[0.08] hover:bg-white/[0.09] active:scale-[0.98] transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/25">
                  {isExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#E50914] transition-colors">
                    Exporter ma bibliothèque
                  </h4>
                  <span className="text-[11px] text-[#8e8e93]">
                    Sauvegarde JSON Track
                  </span>
                </div>
              </div>
            </button>

            {/* Import Button */}
            <button
              type="button"
              disabled={isExporting || isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-between rounded-2xl bg-white/[0.05] p-4 border border-white/[0.08] hover:bg-white/[0.09] active:scale-[0.98] transition-all text-left group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/25">
                  {isImporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#0a84ff] transition-colors">
                    Importer un fichier
                  </h4>
                  <span className="text-[11px] text-[#8e8e93]">
                    JSON Track ou CSV Letterboxd
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8e8e93]/80">
            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[#E50914]" />
            <span>Supporte les exports Letterboxd (watched.csv, diary.csv, ratings.csv, watchlist.csv)</span>
          </div>
        </section>

        {/* Section Expérience iPhone & PWA */}
        <section className="rounded-3xl bg-[#0f0f14] p-5 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-[#30d158]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Expérience iPhone & Hors-Ligne
            </h2>
          </div>
          <p className="text-xs text-[#8e8e93] mb-4 leading-relaxed">
            Track est optimisée pour fonctionner comme une véritable application native iOS sur votre écran d&apos;accueil.
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#30d158]/15 text-[#30d158]">
                  <Wifi className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Cache Hors-Ligne</h4>
                  <p className="text-[10px] text-[#8e8e93]">Bibliothèque & affiches en local</p>
                </div>
              </div>
              <span className="rounded-full bg-[#30d158]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#30d158]">
                Actif
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E50914]/15 text-[#E50914]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Moteur Haptique</h4>
                  <p className="text-[10px] text-[#8e8e93]">Vibrations tactiles Apple Taptic Engine</p>
                </div>
              </div>
              <span className="rounded-full bg-[#E50914]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#E50914]">
                Intégré
              </span>
            </div>

            <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/[0.05] text-[11px] text-[#8e8e93] leading-relaxed">
              <span className="font-semibold text-white">Astuce iPhone : </span>
              Pour une expérience plein écran sans barre Safari, ouvrez le menu Partager (icône carré avec flèche) puis choisissez <span className="text-[#E50914] font-medium">« Sur l&apos;écran d&apos;accueil »</span>.
            </div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}
