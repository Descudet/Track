import { getUserLibraryAction } from "@/lib/db/actions";
import { LibraryClient } from "@/components/library/LibraryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ma Bibliothèque • Track",
  description: "Votre cinémathèque personnelle sur iPhone",
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const libraryItems = await getUserLibraryAction();

  return <LibraryClient initialLibrary={libraryItems} />;
}
