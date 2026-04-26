export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
  accent: string;
}

export const avatarOptions: AvatarOption[] = [
  { id: "spark", emoji: "⚡", name: "Spark", accent: "from-cyan-400 to-sky-500" },
  { id: "nova", emoji: "🌟", name: "Nova", accent: "from-amber-300 to-orange-500" },
  { id: "byte", emoji: "🤖", name: "Byte", accent: "from-fuchsia-400 to-pink-500" },
  { id: "echo", emoji: "🎧", name: "Echo", accent: "from-violet-400 to-indigo-500" },
  { id: "orbit", emoji: "🪐", name: "Orbit", accent: "from-emerald-400 to-teal-500" },
  { id: "blitz", emoji: "🔥", name: "Blitz", accent: "from-rose-400 to-red-500" },
];

export function getAvatarById(avatarId: string) {
  return avatarOptions.find((avatar) => avatar.id === avatarId) ?? avatarOptions[0];
}
