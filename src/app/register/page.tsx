"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popcorn,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { registerAction } from "@/lib/auth/actions";
import { triggerHaptic } from "@/lib/utils/haptics";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!displayName || displayName.trim().length < 2) {
      setError("Veuillez renseigner un pseudo (au moins 2 caractères).");
      triggerHaptic("warning");
      return;
    }

    if (!password || password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      triggerHaptic("warning");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await registerAction({
        displayName: displayName.trim(),
        email: email.trim().length > 0 ? email.trim() : null,
        password,
      });

      if (!res.success) {
        setError(res.error || "Impossible de créer le compte.");
        triggerHaptic("warning");
        setLoading(false);
        return;
      }

      triggerHaptic("success");
      if (typeof window !== "undefined") {
        localStorage.removeItem("track_guest_mode");
        if (res.user) {
          localStorage.setItem("track_user", JSON.stringify(res.user));
          document.cookie = `track_user_id=${res.user.id}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
      window.location.href = "/profile";
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'inscription.");
      triggerHaptic("warning");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050507] text-white flex flex-col justify-between px-5 py-6">
      {/* Top Floating Back Button */}
      <div className="pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              router.push("/");
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white active:scale-90 transition-transform touch-manipulation cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Main Form Center */}
      <div className="mx-auto w-full max-w-sm my-auto py-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-[0_4px_24px_rgba(229,9,20,0.35)] mb-4">
            <Popcorn className="h-7 w-7 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Créer un compte Track
          </h1>
          <p className="mt-2 text-xs text-[#8e8e93] max-w-xs leading-relaxed">
            Synchronisez votre bibliothèque, vos notes et vos épisodes sur votre iPhone, Mac et iPad.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-[#ff453a]/15 p-3.5 text-xs text-[#ff453a] border border-[#ff453a]/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} method="post" action="#" className="space-y-4">
          {/* Display Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider pl-1">
              Pseudo (identifiant unique)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#8e8e93] pointer-events-none">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex. Descudet, Alex..."
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl bg-white/[0.06] border border-white/10 pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.09] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider pl-1">
              Adresse e-mail <span className="text-white/40 font-normal lowercase">(optionnel)</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#8e8e93] pointer-events-none">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com (facultatif)"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full rounded-2xl bg-white/[0.06] border border-white/10 pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.09] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider pl-1">
              Mot de passe (min. 6 caractères)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#8e8e93] pointer-events-none">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                autoComplete="new-password"
                className="w-full rounded-2xl bg-white/[0.06] border border-white/10 pl-10 pr-11 py-3.5 text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.09] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#8e8e93] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Notice about local migration */}
          <div className="flex items-start gap-2 pt-1 text-[11px] text-[#8e8e93] leading-relaxed">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#E50914] mt-0.5" />
            <span>Vos films et données déjà présents sur cet appareil seront automatiquement rattachés à votre nouveau compte.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E50914] to-[#B81D24] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E50914]/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Créer mon compte</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#8e8e93]">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/login"
              onClick={() => triggerHaptic("light")}
              className="text-[#E50914] font-semibold hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Footer safe area spacer */}
      <div className="pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]" />
    </div>
  );
}
