import { useEffect, useState } from "react";

const SOUND_KEY = "brainbuzz_sound_enabled";

export function useSoundPreference() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(SOUND_KEY) !== "false");

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(enabled));
  }, [enabled]);

  return {
    enabled,
    toggle: () => setEnabled((current) => !current),
  };
}
