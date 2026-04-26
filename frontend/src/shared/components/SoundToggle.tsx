interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-white/25"
    >
      {enabled ? "Sound On" : "Sound Off"}
    </button>
  );
}
