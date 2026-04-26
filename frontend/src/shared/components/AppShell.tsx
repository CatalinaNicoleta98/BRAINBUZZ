import { PropsWithChildren } from "react";
import { getThemeById } from "../utils/themes";

interface AppShellProps extends PropsWithChildren {
  themeId?: string;
}

export function AppShell({ children, themeId }: AppShellProps) {
  const theme = getThemeById(themeId);

  return (
    <div className={`min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-8 ${theme.shellClassName}`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        {children}
      </div>
    </div>
  );
}
