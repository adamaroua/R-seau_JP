import { ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/database";

export function RoleBadge({ role, compact = false }: { role: Role; compact?: boolean }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-admin/40 bg-admin/10 px-1.5 py-0.5 text-xs font-bold text-admin">
        <ShieldCheck className="h-3.5 w-3.5" />
        {!compact && "admin"}
      </span>
    );
  }

  if (role === "moderator") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-sky/40 bg-sky/10 px-1.5 py-0.5 text-xs font-bold text-sky">
        <Sparkles className="h-3.5 w-3.5" />
        {!compact && "modo"}
      </span>
    );
  }

  return <span className="h-2 w-2 rounded-full bg-danger" aria-label="utilisateur" />;
}

export function usernameColor(role: Role) {
  return cn(role === "admin" ? "text-admin" : role === "moderator" ? "text-sky" : "text-danger");
}
