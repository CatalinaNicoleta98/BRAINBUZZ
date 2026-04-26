import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";

export function PlayerJoinPage() {
  return (
    <AppShell>
      <GlassPanel>
        <h1 className="font-display text-3xl font-bold">Join Room</h1>
        <p className="mt-3 text-slate-300">PIN and display name entry will appear here.</p>
      </GlassPanel>
    </AppShell>
  );
}
