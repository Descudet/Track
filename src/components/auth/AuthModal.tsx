"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Popcorn,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { triggerHaptic } from "@/lib/utils/haptics";
import { loginAction, registerAction } from "@/lib/auth/actions";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user?: { id: string; email: string | null; displayName: string }) => void;
  allowDismiss?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  allowDismiss = true,
}: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGuestContinue = () => {
    triggerHaptic("medium");
    if (typeof window !== "undefined") {
      localStorage.setItem("track_guest_mode", "true");
      document.cookie =
        "track_guest=true; path=/; max-age=31536000; SameSite=Lax";
    }
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsLoading(true);
    triggerHaptic("light");

    try {
      const res = await loginAction({ identifier, password });
      if (!res.success) {
        triggerHaptic("warning");
        setError(res.error || "Identifiants invalides.");
        setIsLoading(false);
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
      if (onSuccess) {
        onSuccess(res.user);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err: any) {
      triggerHaptic("warning");
      setError(err?.message || "Une erreur est survenue lors de la connexion.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsLoading(true);
    triggerHaptic("light");

    try {
      const res = await registerAction({ displayName, email, password });
      if (!res.success) {
        triggerHaptic("warning");
        setError(res.error || "Impossible de créer le compte.");
        setIsLoading(false);
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
      if (onSuccess) {
        onSuccess(res.user);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err: any) {
      triggerHaptic("warning");
      setError(err?.message || "Une erreur est survenue lors de l'inscription.");
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Modal Card */}
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto no-scrollbar rounded-3xl bg-[#0f0f14] border border-white/10 p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200 my-auto">
        {/* Glow ambient background accent */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-[#E50914]/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-44 w-44 rounded-full bg-[#E50914]/10 blur-3xl" />

        {/* Top Dismiss Button (if allowed) */}
        {allowDismiss && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/70 hover:bg-white/[0.15] hover:text-white transition-all active:scale-95"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-[0_0_24px_rgba(229,9,20,0.4)]">
            <Popcorn className="h-6 w-6 text-white stroke-[2.5]" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-xl sm:text-2xl font-black tracking-tight text-white"
          >
            Bienvenue sur Track
          </h2>
          <p className="mt-1 text-xs text-[#8e8e93] leading-relaxed max-w-xs mx-auto">
            Synchronisez votre cinémathèque, notes et épisodes sur tous vos appareils.
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="mb-5 flex rounded-2xl bg-white/[0.06] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("login");
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === "login"
                ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/30"
                : "text-white/70 hover:text-white"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("register");
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === "register"
                ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/30"
                : "text-white/70 hover:text-white"
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#ff453a]/15 border border-[#ff453a]/30 p-3 text-xs text-[#ff453a] animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 stroke-[2.5]" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Form Body */}
        {activeTab === "login" ? (
          <form onSubmit={handleLogin} method="post" action="#" className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1 ml-1">
                Pseudo ou adresse e-mail
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Votre pseudo ou e-mail"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.08] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1 ml-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 pl-10 pr-11 py-3 text-base sm:text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.08] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B81D24] py-3 text-sm font-bold text-white shadow-lg shadow-[#E50914]/25 hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} method="post" action="#" className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1 ml-1">
                Pseudo (identifiant unique)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Descudet, Alex..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.08] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1 ml-1">
                Adresse e-mail <span className="text-white/40 font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com (facultatif)"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.08] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1 ml-1">
                Mot de passe (min. 6 caractères)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/10 pl-10 pr-11 py-3 text-base sm:text-sm text-white placeholder-white/30 focus:border-[#E50914] focus:bg-white/[0.08] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2.5 text-[11px] text-white/60 border border-white/5">
              <ShieldCheck className="h-4 w-4 text-[#30d158] shrink-0" />
              <span>Vos œuvres déjà suivies en local seront automatiquement synchronisées.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B81D24] py-3 text-sm font-bold text-white shadow-lg shadow-[#E50914]/25 hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <span>Créer mon compte</span>
              )}
            </button>
          </form>
        )}

        {/* Separator */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">
            ou
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Guest Action */}
        <div>
          <button
            type="button"
            onClick={handleGuestContinue}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 py-3 px-4 text-xs sm:text-sm font-semibold text-white/90 active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <span>Continuer en tant qu'invité</span>
            <ArrowRight className="h-4 w-4 text-[#E50914]" />
          </button>
          <p className="mt-2 text-center text-[10px] text-[#8e8e93]">
            Données conservées sur cet appareil. Connexion possible à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
}
