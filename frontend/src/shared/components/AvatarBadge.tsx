import { getAvatarById } from "../utils/avatars";

interface AvatarBadgeProps {
  avatarId: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarBadge({ avatarId, size = "md" }: AvatarBadgeProps) {
  const avatar = getAvatarById(avatarId);
  const sizeClasses = {
    sm: "h-10 w-10 text-lg",
    md: "h-12 w-12 text-xl",
    lg: "h-16 w-16 text-3xl",
  };

  return (
    <div className={`flex ${sizeClasses[size]} items-center justify-center rounded-2xl bg-gradient-to-br ${avatar.accent} shadow-neon`}>
      <span aria-label={avatar.name}>{avatar.emoji}</span>
    </div>
  );
}
