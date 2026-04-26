import { avatarOptions } from "../utils/avatars";
import { AvatarBadge } from "./AvatarBadge";

interface AvatarPickerProps {
  selectedAvatarId: string;
  onSelect: (avatarId: string) => void;
}

export function AvatarPicker({ selectedAvatarId, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {avatarOptions.map((avatar) => {
        const selected = avatar.id === selectedAvatarId;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={`rounded-3xl border p-3 transition ${
              selected ? "border-electric bg-electric/10" : "border-white/10 bg-white/5 hover:border-white/25"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <AvatarBadge avatarId={avatar.id} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{avatar.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
