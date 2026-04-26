import { PropsWithChildren } from "react";
import { getThemeById } from "../utils/themes";

interface GlassPanelProps extends PropsWithChildren {
  themeId?: string;
}

export function GlassPanel({ children, themeId }: GlassPanelProps) {
  const theme = getThemeById(themeId);

  return (
    <div className={`rounded-[2rem] border p-6 shadow-neon backdrop-blur-xl ${theme.panelClassName}`}>
      {children}
    </div>
  );
}
