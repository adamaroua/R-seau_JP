"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: String(formData.get("password") ?? ""),
        username: String(formData.get("username") ?? "")
      })
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "Inscription impossible");
      setLoading(false);
      return;
    }

    setSuccess("Compte cree. Connecte-toi pour entrer.");
    setLoading(false);
    setTimeout(() => router.push("/auth/login"), 900);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="username"
        autoComplete="username"
        placeholder="Identifiant unique"
        className="focus-ring w-full rounded-md border border-line bg-ink px-3 py-3 text-sm"
        required
      />
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        placeholder="Mot de passe"
        className="focus-ring w-full rounded-md border border-line bg-ink px-3 py-3 text-sm"
        required
      />
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      {success && <p className="text-sm font-semibold text-admin">{success}</p>}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-danger px-4 py-3 text-sm font-black text-white disabled:opacity-60"
      >
        <UserPlus className="h-4 w-4" />
        {loading ? "Creation" : "Creer le compte"}
      </button>
    </form>
  );
}
