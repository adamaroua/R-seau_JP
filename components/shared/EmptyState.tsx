import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-line bg-panel p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-zinc-500" />
      <h2 className="mt-3 text-base font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{body}</p>
    </div>
  );
}
