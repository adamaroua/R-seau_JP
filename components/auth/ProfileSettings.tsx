"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, Save, Trash2 } from "lucide-react";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { QuotaMeter } from "@/components/shared/QuotaMeter";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { DAILY_UPLOAD_BYTES, SAVED_POSTS_BYTES } from "@/lib/storage";
import type { SessionProfile } from "@/types/database";

export function ProfileSettings({
  profile,
  avatarUrl,
  dailyUploadBytes,
  savedPostsBytes
}: {
  profile: SessionProfile;
  avatarUrl: string | null;
  dailyUploadBytes: number;
  savedPostsBytes: number;
}) {
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(avatarUrl);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(formData.get("username") ?? ""),
        displayName: String(formData.get("displayName") ?? ""),
        bio: String(formData.get("bio") ?? "")
      })
    });
    const json = await response.json();
    setMessage(response.ok ? "Profil mis a jour" : json.error ?? "Erreur");
    router.refresh();
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.set("avatar", file);
    const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    const json = await response.json();
    if (response.ok) {
      setAvatar(json.avatar_url);
      setMessage("Photo mise a jour");
      router.refresh();
    } else {
      setMessage(json.error ?? "Upload impossible");
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: String(formData.get("password") ?? "") })
    });
    const json = await response.json();
    setMessage(response.ok ? "Mot de passe mis a jour" : json.error ?? "Erreur");
    event.currentTarget.reset();
  }

  async function deleteAccount() {
    const ok = window.confirm("Supprimer definitivement ton compte ?");
    if (!ok) return;
    const response = await fetch("/api/profile/delete", { method: "DELETE" });
    if (response.ok) router.push("/auth/register");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-3 py-5 lg:grid-cols-[minmax(0,620px)_320px]">
      <section className="space-y-4">
        <form onSubmit={saveProfile} className="rounded-md border border-line bg-panel p-4 shadow-glow">
          <div className="flex items-center gap-3">
            <UserAvatar username={profile.username} avatarUrl={avatar} size="lg" />
            <div>
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-sky/60 hover:text-white"
                onClick={() => avatarRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Photo
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => uploadAvatar(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="text-sm font-semibold text-zinc-300">
              Pseudo
              <input
                name="username"
                defaultValue={profile.username}
                className="focus-ring mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-300">
              Nom affiche
              <input
                name="displayName"
                defaultValue={profile.display_name ?? ""}
                className="focus-ring mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-300">
              Bio
              <textarea
                name="bio"
                defaultValue={profile.bio ?? ""}
                maxLength={160}
                rows={3}
                className="focus-ring mt-1 w-full resize-none rounded-md border border-line bg-ink px-3 py-2 text-white"
              />
            </label>
          </div>

          {message && <p className="mt-3 text-sm font-semibold text-sky">{message}</p>}

          <button
            type="submit"
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-black text-white"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </form>

        <form onSubmit={updatePassword} className="rounded-md border border-line bg-panel p-4">
          <h2 className="text-base font-black">Mot de passe</h2>
          <div className="mt-3 flex gap-2">
            <input
              name="password"
              type="password"
              minLength={8}
              placeholder="Nouveau mot de passe"
              className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-sky text-ink"
              title="Modifier"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-md border border-line bg-panel p-4">
          <h2 className="text-base font-black">Stockage</h2>
          <div className="mt-4 space-y-4">
            <QuotaMeter used={dailyUploadBytes} limit={DAILY_UPLOAD_BYTES} label="Uploads du jour" />
            <QuotaMeter used={savedPostsBytes} limit={SAVED_POSTS_BYTES} label="Posts sauvegardes" />
          </div>
        </div>

        <div className="rounded-md border border-line bg-panel p-4">
          <h2 className="text-base font-black">Compte</h2>
          <div className="mt-3 flex flex-col gap-2">
            <SignOutButton />
            <button
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-danger/40 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10"
              type="button"
              onClick={deleteAccount}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer le compte
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
