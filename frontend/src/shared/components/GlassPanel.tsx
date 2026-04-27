import { PropsWithChildren } from "react";
import { getThemeById } from "../utils/themes";

interface GlassPanelProps extends PropsWithChildren {
  themeId?: string;
}

export function GlassPanel({ children, themeId }: GlassPanelProps) {
  const theme = getThemeById(themeId);

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-neon backdrop-blur-xl ${theme.panelClassName}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
