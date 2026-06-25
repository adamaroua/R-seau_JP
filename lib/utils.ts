import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export function timeAgo(date: string) {
  const diffSeconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

  if (diffSeconds < 60) return "maintenant";
  if (diffSeconds < 3600) return formatter.format(-Math.floor(diffSeconds / 60), "minute");
  if (diffSeconds < 86400) return formatter.format(-Math.floor(diffSeconds / 3600), "hour");
  return formatter.format(-Math.floor(diffSeconds / 86400), "day");
}

export function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export function bytesToMo(bytes: number) {
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}
