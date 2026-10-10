"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { eq, or, sql } from "drizzle-orm";
import { db, ensureDbInitialized } from "@/lib/db";
import { users, userMedia, episodeProgress, watchLogs } from "@/lib/db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getCurrentUser,
  DEFAULT_USER_ID,
} from "./index";

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string | null;
    displayName: string;
  };
}

/**
 * Inscription utilisateur avec pseudo, mot de passe et email (optionnel)
 */
export async function registerAction(formData: {
  displayName: string;
  email?: string | null;
  password: string;
}): Promise<AuthResponse> {
  await ensureDbInitialized();

  const displayName = (formData.displayName || "").trim();
  const rawEmail = (formData.email || "").trim().toLowerCase();
  const email = rawEmail.length > 0 ? rawEmail : null;
  const password = formData.password || "";

  // Validations
  if (!displayName || displayName.length < 2) {
    return { success: false, error: "Veuillez renseigner un pseudo (au moins 2 caractères)." };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  if (email && (!email.includes("@") || !email.includes("."))) {
    return { success: false, error: "L'adresse e-mail renseignée n'est pas valide." };
  }

  // Vérifier si le pseudo existe déjà (insensible à la casse)
  const existingPseudo = await db
    .select()
    .from(users)
    .where(sql`lower(${users.displayName}) = ${displayName.toLowerCase()}`)
    .get();

  if (existingPseudo) {
    return { success: false, error: "Ce pseudo est déjà utilisé. Veuillez en choisir un autre." };
  }

  // Vérifier si l'adresse e-mail existe déjà si fournie
  if (email) {
    const existingEmail = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .get();

    if (existingEmail) {
      return { success: false, error: "Cette adresse e-mail est déjà associée à un compte." };
    }
  }

  const userId = `usr_${crypto.randomBytes(12).toString("hex")}`;
  const passwordHash = hashPassword(password);
  const now = Date.now();

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    displayName,
    createdAt: now,
    updatedAt: now,
  });

  // Transférer automatiquement les données de la session anonyme par défaut si présentes
  try {
    const anonymousItems = await db
      .select()
      .from(userMedia)
      .where(eq(userMedia.userId, DEFAULT_USER_ID))
      .all();

    for (const item of anonymousItems) {
      await db.insert(userMedia).values({
        id: `${userId}_${item.mediaItemId}`,
        userId: userId,
        mediaItemId: item.mediaItemId,
        status: item.status,
        isFavorite: item.isFavorite,
        userRating: item.userRating,
        userReview: item.userReview,
        rewatchCount: item.rewatchCount,
        watchedAt: item.watchedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    const anonymousEpisodes = await db
      .select()
      .from(episodeProgress)
      .where(eq(episodeProgress.userId, DEFAULT_USER_ID))
      .all();

    for (const ep of anonymousEpisodes) {
      await db.insert(episodeProgress).values({
        id: `${userId}_tv${ep.tmdbTvId}_s${ep.seasonNumber}_e${ep.episodeNumber}`,
        userId: userId,
        tmdbTvId: ep.tmdbTvId,
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        isWatched: ep.isWatched,
        watchedAt: ep.watchedAt,
      });
    }
  } catch (err) {
    console.warn("Notice: could not migrate anonymous items:", err);
  }

  await createSession(userId);

  revalidatePath("/", "layout");

  return {
    success: true,
    user: {
      id: userId,
      email,
      displayName,
    },
  };
}

/**
 * Connexion utilisateur avec pseudo OU email et mot de passe
 */
export async function loginAction(formData: {
  identifier?: string;
  email?: string;
  password: string;
}): Promise<AuthResponse> {
  await ensureDbInitialized();

  const query = (formData.identifier || formData.email || "").trim().toLowerCase();
  const password = formData.password || "";

  if (!query || !password) {
    return { success: false, error: "Veuillez renseigner votre pseudo (ou e-mail) et mot de passe." };
  }

  // Chercher l'utilisateur par email OU par pseudo (insensible à la casse)
  const user = await db
    .select()
    .from(users)
    .where(
      or(
        sql`lower(${users.email}) = ${query}`,
        sql`lower(${users.displayName}) = ${query}`
      )
    )
    .get();

  if (!user || !user.passwordHash) {
    return { success: false, error: "Identifiant ou mot de passe incorrect." };
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Identifiant ou mot de passe incorrect." };
  }

  await createSession(user.id);

  revalidatePath("/", "layout");

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };
}

/**
 * Déconnexion utilisateur
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  await destroySession();
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Récupérer l'utilisateur connecté pour l'UI client
 */
export async function getCurrentUserAction() {
  return getCurrentUser();
}
