import { getUserStatsAction } from "@/lib/db/actions";
import { getCurrentUserAction } from "@/lib/auth/actions";
import { ProfileClient } from "@/components/profile/ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Journal • Track",
  description: "Statistiques et journal cinématographique sur iPhone",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [stats, currentUser] = await Promise.all([
    getUserStatsAction(),
    getCurrentUserAction(),
  ]);

  return <ProfileClient stats={stats} currentUser={currentUser} />;
}
