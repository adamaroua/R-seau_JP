import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type UserAvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base"
};

export function UserAvatar({ username, avatarUrl, size = "md", className }: UserAvatarProps) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-panelSoft font-black text-white",
        sizes[size],
        className
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <span>{initials(username)}</span>
      )}
    </div>
  );
}
