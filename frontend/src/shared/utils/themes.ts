import type { ThemeOption } from "../types/theme";

export const themeOptions: ThemeOption[] = [
  {
    id: "midnight",
    name: "Midnight Pulse",
    description: "Neon cyan and magenta on deep midnight glass.",
    shellClassName:
      "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_right,rgba(244,114,182,0.18),transparent_26%),linear-gradient(180deg,#070b16_0%,#09090f_55%,#05070c_100%)]",
    panelClassName: "bg-white/5 border-white/10",
    accentClassName: "from-cyan-400 to-fuchsia-500",
  },
  {
    id: "sunset",
    name: "Sunset Arcade",
    description: "Orange, coral, and peach tones with warm contrast.",
    shellClassName:
      "bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.24),transparent_30%),radial-gradient(circle_at_left,rgba(244,114,182,0.18),transparent_24%),linear-gradient(180deg,#1a0d0c_0%,#130b14_55%,#0c0810_100%)]",
    panelClassName: "bg-white/6 border-orange-200/15",
    accentClassName: "from-orange-300 to-rose-400",
  },
  {
    id: "forest",
    name: "Forest Signal",
    description: "Emerald, teal, and aurora greens with cooler panels.",
    shellClassName:
      "bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.2),transparent_28%),radial-gradient(circle_at_right,rgba(45,212,191,0.16),transparent_25%),linear-gradient(180deg,#06100d_0%,#08110f_55%,#050908_100%)]",
    panelClassName: "bg-white/5 border-emerald-200/15",
    accentClassName: "from-emerald-300 to-teal-400",
  },
];

export function getThemeById(themeId?: string) {
  return themeOptions.find((theme) => theme.id === themeId) ?? themeOptions[0];
}
