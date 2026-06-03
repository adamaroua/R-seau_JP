import { Megaphone } from "lucide-react";

export function AdPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-panel/70 p-4 text-sm text-zinc-400">
      <div className="flex items-center gap-2 font-semibold text-zinc-300">
        <Megaphone className="h-4 w-4 text-note" />
        Emplacement annonce
      </div>
      {!compact && <p className="mt-2 text-xs text-zinc-500">Reserve, aucune publicite active.</p>}
    </div>
  );
}
