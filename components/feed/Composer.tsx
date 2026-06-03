"use client";

import { FormEvent, useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { MAX_POST_IMAGE_BYTES } from "@/lib/storage";
import { bytesToMo } from "@/lib/utils";

type ComposerProps = {
  username: string;
  avatarUrl: string | null;
  onPosted: () => void;
};

export function Composer({ username, avatarUrl, onPosted }: ComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPosting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/posts", {
      method: "POST",
      body: formData
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "Publication impossible");
      setPosting(false);
      return;
    }

    formRef.current?.reset();
    setPreview(null);
    setPosting(false);
    onPosted();
  }

  function onFileChange(file: File | null) {
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > MAX_POST_IMAGE_BYTES) {
      setError(`Image trop lourde: ${bytesToMo(MAX_POST_IMAGE_BYTES)} max`);
      if (fileRef.current) fileRef.current.value = "";
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form ref={formRef} onSubmit={submit} className="rounded-md border border-line bg-panel p-4 shadow-glow">
      <div className="flex gap-3">
        <UserAvatar username={username} avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1">
          <textarea
            name="body"
            rows={3}
            maxLength={560}
            placeholder="Quoi de neuf au lycee ?"
            className="focus-ring min-h-24 w-full resize-none rounded-md border border-line bg-ink px-3 py-2 text-sm text-white placeholder:text-zinc-500"
          />

          {preview && (
            <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-md border border-line bg-ink">
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <button
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-black/70 text-white"
                type="button"
                title="Retirer l'image"
                onClick={() => {
                  if (fileRef.current) fileRef.current.value = "";
                  setPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}

          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-sky/60 hover:text-white">
              <ImagePlus className="h-4 w-4" />
              Image
              <input
                ref={fileRef}
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-black text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={posting}
              type="submit"
            >
              <Send className="h-4 w-4" />
              {posting ? "Envoi" : "Poster"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
