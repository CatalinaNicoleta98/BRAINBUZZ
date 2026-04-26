import { getThemeById } from "../utils/themes";

interface ThemePreviewCardProps {
  themeId: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ThemePreviewCard({ themeId, selected = false, onClick }: ThemePreviewCardProps) {
  const theme = getThemeById(themeId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.75rem] border p-4 text-left transition ${
        selected ? "border-electric bg-electric/10" : "border-white/10 bg-white/5 hover:border-white/25"
      }`}
    >
      <div className={`h-20 rounded-2xl ${theme.shellClassName}`} />
      <div className="mt-4 font-display text-xl">{theme.name}</div>
      <div className="mt-1 text-sm text-slate-300">{theme.description}</div>
    </button>
  );
}
