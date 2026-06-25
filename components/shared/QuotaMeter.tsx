import { bytesToMo } from "@/lib/utils";

export function QuotaMeter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const value = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>
          {bytesToMo(used)} / {bytesToMo(limit)}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink">
        <div className="h-full rounded-full bg-sky" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
