"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { identifierToAuthEmail } from "@/lib/auth-identifier";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: identifierToAuthEmail(username),
      password
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="username"
        autoComplete="username"
        placeholder="Identifiant"
        className="focus-ring w-full rounded-md border border-line bg-ink px-3 py-3 text-sm"
        required
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Mot de passe"
        className="focus-ring w-full rounded-md border border-line bg-ink px-3 py-3 text-sm"
        required
      />
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-danger px-4 py-3 text-sm font-black text-white disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Connexion" : "Entrer"}
      </button>
    </form>
  );
}
