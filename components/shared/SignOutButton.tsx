"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-danger/50 hover:text-white"
      type="button"
      onClick={signOut}
    >
      <LogOut className="h-4 w-4" />
      Deconnexion
    </button>
  );
}
